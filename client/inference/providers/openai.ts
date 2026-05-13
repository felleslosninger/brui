import type { ToolDefinition } from '../../types';
import type { ConversationMessage, InferenceContext, InferenceResult, InteractionMode } from '../../inference';
import { prepareReferenceContext } from '../referenceContext';
import {
    type InferenceRequest,
    type OpenAIChatCompletionChunk,
    type OpenAIChatCompletionMessage,
    type OpenAIChatCompletionRequest,
    type OpenAIChatCompletionResponse,
    parseToolCalls,
} from '../types';

export interface StreamCallbacks {
    onThinking?: (text: string) => void;
    onContentStream?: (text: string) => void;
}

const nonEmptyResponseInstruction = 'Never return an empty response. You must either call a tool or send a brief user-facing reply.';

function resolveTarget(ctx: InferenceContext): { target: string; endpoint: string } {
    const target = ctx.config.inference?.name;
    const endpoint = ctx.config.inference?.endpoint;
    if (!target || !endpoint) {
        throw new Error(
            'Inference target is not configured. Set `inference.spec.name` and `inference.spec.endpoint` in your Configuration.'
        );
    }
    return { target, endpoint };
}

function buildSystemPrompt(
    interactionMode?: InteractionMode,
    hasReferenceContext = false
): string {
    const modeInstruction = interactionMode === 'Act'
        ? 'The user is currently in Act mode. If a supported tool can satisfy the request, call it instead of replying with text.'
        : 'The user is currently in Info mode. Answer questions with text only. Do not call tools.';
    const referenceContextInstruction = hasReferenceContext
        ? 'Reference context will also be provided. Prefer answering from that context when it is relevant. If the reference context contains the answer, answer from it directly even if the topic is outside the application domain. If it does not contain enough information, say so clearly before relying on general knowledge. If you use the reference context, mention the relevant source titles or paths briefly.'
        : '';

    return `You are a helpful assistant that controls a web application. When the user asks you to perform an action, you MUST use the provided tools/functions. Do not respond with text when a tool call is appropriate. Always prefer calling tools over explaining what you would do. ${modeInstruction} ${referenceContextInstruction}`.trim();
}

function serializeConversationHistory(
    conversationHistory: ConversationMessage[] = []
): OpenAIChatCompletionRequest['messages'] {
    return conversationHistory
        .filter(({ content }) => content.trim() !== '')
        .map(({ role, content }) => ({
            role,
            content,
        }));
}

function buildPayload(
    ctx: InferenceContext,
    messages: ConversationMessage[],
    options: {
        systemPrompt: string;
        tools?: ToolDefinition[];
        includeReferenceContext?: boolean;
    }
): OpenAIChatCompletionRequest {
    const preparedReferenceContext = options.includeReferenceContext === false
        ? null
        : (ctx.referenceContext ?? prepareReferenceContext(ctx.context, getLatestUserMessageContent(messages)));
    const referenceContextMessage = preparedReferenceContext?.prompt || null;

    return {
        messages: [
            {
                role: 'system',
                content: options.systemPrompt,
            },
            ...(referenceContextMessage
                ? [{
                    role: 'system' as const,
                    content: referenceContextMessage,
                }]
                : []),
            ...serializeConversationHistory(ctx.conversationHistory),
            ...serializeConversationHistory(messages),
        ],
        tools: options.tools && options.tools.length > 0 ? options.tools : undefined,
        stream: false,
    };
}

async function requestOpenAICompletion(
    ctx: InferenceContext,
    messages: ConversationMessage[],
    options: {
        systemPrompt: string;
        tools?: ToolDefinition[];
        includeReferenceContext?: boolean;
    }
): Promise<OpenAIChatCompletionMessage> {
    const { target, endpoint } = resolveTarget(ctx);

    const request: InferenceRequest = {
        target,
        payload: buildPayload(ctx, messages, options),
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Inference error (${response.status}): ${errorText}`);
    }

    const chat = await response.json() as OpenAIChatCompletionResponse;
    const message = chat.choices[0]?.message;

    if (!message) {
        throw new Error('Inference response did not include any choices');
    }

    return message;
}

async function requestOpenAIStreamingCompletion(
    ctx: InferenceContext,
    messages: ConversationMessage[],
    options: {
        systemPrompt: string;
        tools?: ToolDefinition[];
        includeReferenceContext?: boolean;
    },
    callbacks?: StreamCallbacks
): Promise<OpenAIChatCompletionMessage> {
    const { target, endpoint } = resolveTarget(ctx);

    const payload = buildPayload(ctx, messages, options);
    const streamingPayload = { ...payload, stream: true as const };

    const request: InferenceRequest = {
        target,
        payload: streamingPayload as unknown as InferenceRequest['payload'],
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Inference error (${response.status}): ${errorText}`);
    }

    if (!response.body) {
        throw new Error('Streaming response has no body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let content = '';
    let thinkingContent = '';
    let insideThinkTag = false;
    let toolCalls: Record<number, { id: string; type: string; function: { name: string; arguments: string } }> = {};
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;

            let chunk: OpenAIChatCompletionChunk;
            try {
                chunk = JSON.parse(data);
            } catch {
                continue;
            }

            const delta = chunk.choices?.[0]?.delta;
            if (!delta) continue;

            if (delta.content) {
                // Parse inline <think>...</think> tags streamed within content
                let remaining = delta.content;
                while (remaining) {
                    if (insideThinkTag) {
                        const closeIdx = remaining.indexOf('</think>');
                        if (closeIdx === -1) {
                            thinkingContent += remaining;
                            callbacks?.onThinking?.(thinkingContent);
                            remaining = '';
                        } else {
                            thinkingContent += remaining.slice(0, closeIdx);
                            callbacks?.onThinking?.(thinkingContent);
                            insideThinkTag = false;
                            remaining = remaining.slice(closeIdx + '</think>'.length);
                        }
                    } else {
                        const openIdx = remaining.indexOf('<think>');
                        if (openIdx === -1) {
                            content += remaining;
                            callbacks?.onContentStream?.(content);
                            remaining = '';
                        } else {
                            const before = remaining.slice(0, openIdx);
                            if (before) {
                                content += before;
                                callbacks?.onContentStream?.(content);
                            }
                            insideThinkTag = true;
                            remaining = remaining.slice(openIdx + '<think>'.length);
                        }
                    }
                }
            }

            // Handle reasoning/thinking tokens from various providers
            const deltaAny = delta as Record<string, unknown>;
            const thinking = deltaAny.reasoning_content ?? deltaAny.thinking ?? deltaAny.reasoning;
            if (typeof thinking === 'string' && thinking) {
                thinkingContent += thinking;
                callbacks?.onThinking?.(thinkingContent);
            }

            // Accumulate streamed tool calls
            if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                    const idx = tc.index;
                    if (!toolCalls[idx]) {
                        toolCalls[idx] = {
                            id: tc.id || '',
                            type: tc.type || 'function',
                            function: { name: '', arguments: '' },
                        };
                    }
                    if (tc.id) toolCalls[idx].id = tc.id;
                    if (tc.function?.name) toolCalls[idx].function.name += tc.function.name;
                    if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
                }
            }
        }
    }

    const assembledToolCalls = Object.values(toolCalls);

    return {
        role: 'assistant',
        content: content || null,
        refusal: null,
        ...(assembledToolCalls.length > 0 ? {
            tool_calls: assembledToolCalls.map(tc => ({
                id: tc.id,
                type: 'function' as const,
                function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments,
                },
            })),
        } : {}),
    };
}

export async function requestOpenAIInference(
    content: string,
    ctx: InferenceContext,
    callbacks?: StreamCallbacks
): Promise<InferenceResult> {
    const allTools: ToolDefinition[] = ctx.config.decisions?.tools || [];
    const isActMode = ctx.interactionMode === 'Act';
    const tools = isActMode ? allTools : [];
    const preparedReferenceContext = ctx.referenceContext ?? prepareReferenceContext(ctx.context, content);
    const includeReferenceContext = Boolean(preparedReferenceContext);
    let message = await requestOpenAIStreamingCompletion(
        ctx,
        [{ role: 'user', content }],
        {
            systemPrompt: buildSystemPrompt(ctx.interactionMode, includeReferenceContext),
            tools,
            includeReferenceContext,
        },
        callbacks
    );

    let toolCalls = parseToolCalls(message);

    if (toolCalls.length === 0 && !(message.content || '').trim()) {
        message = await requestOpenAIStreamingCompletion(
            ctx,
            [{ role: 'user', content }],
            {
                systemPrompt: `${buildSystemPrompt(ctx.interactionMode, includeReferenceContext)} ${nonEmptyResponseInstruction}`,
                tools,
                includeReferenceContext,
            },
            callbacks
        );

        toolCalls = parseToolCalls(message);
    }

    return toolCalls.length > 0
        ? toolCalls
        : (message.content || '');
}

export async function requestOpenAITextResponse(
    messages: ConversationMessage[],
    ctx: InferenceContext,
    systemPrompt: string
): Promise<string> {
    const message = await requestOpenAICompletion(
        ctx,
        messages,
        {
            systemPrompt,
            includeReferenceContext: false,
        }
    );

    return message.content || '';
}

function getLatestUserMessageContent(messages: ConversationMessage[]): string {
    for (let index = messages.length - 1; index >= 0; index--) {
        if (messages[index].role === 'user') {
            return messages[index].content;
        }
    }

    return '';
}
