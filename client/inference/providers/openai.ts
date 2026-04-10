import type { ToolDefinition } from '../../types';
import type { ConversationMessage, InferenceContext, InferenceResult, InteractionMode } from '../../inference';
import { prepareReferenceContext } from '../referenceContext';
import {
    type InferenceRequest,
    type OpenAIChatCompletionMessage,
    type OpenAIChatCompletionRequest,
    type OpenAIChatCompletionResponse,
    parseToolCalls,
} from '../types';

const defaultEndpoint = 'http://localhost:8091';
const nonEmptyResponseInstruction = 'Never return an empty response. You must either call a tool or send a brief user-facing reply.';

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
    const target = ctx.config.inference?.name || 'local-nano';
    const endpoint = ctx.config.inference?.endpoint || defaultEndpoint;

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

export async function requestOpenAIInference(
    content: string,
    ctx: InferenceContext
): Promise<InferenceResult> {
    const allTools: ToolDefinition[] = ctx.config.decisions?.tools || [];
    const isActMode = ctx.interactionMode === 'Act';
    const tools = isActMode ? allTools : [];
    const preparedReferenceContext = ctx.referenceContext ?? prepareReferenceContext(ctx.context, content);
    const includeReferenceContext = Boolean(preparedReferenceContext);
    let message = await requestOpenAICompletion(
        ctx,
        [{ role: 'user', content }],
        {
            systemPrompt: buildSystemPrompt(ctx.interactionMode, includeReferenceContext),
            tools,
            includeReferenceContext,
        }
    );

    let toolCalls = parseToolCalls(message);

    if (toolCalls.length === 0 && !(message.content || '').trim()) {
        message = await requestOpenAICompletion(
            ctx,
            [{ role: 'user', content }],
            {
                systemPrompt: `${buildSystemPrompt(ctx.interactionMode, includeReferenceContext)} ${nonEmptyResponseInstruction}`,
                tools,
                includeReferenceContext,
            }
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
