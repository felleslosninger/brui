import type { ToolDefinition } from '../../types';
import type { InferenceContext, InferenceResult } from '../../inference';
import {
    type InferenceRequest,
    type OpenAIChatCompletionRequest,
    type OpenAIChatCompletionResponse,
    parseToolCalls,
} from '../types';

const defaultEndpoint = 'http://localhost:8091';

export async function requestOpenAIInference(
    content: string,
    ctx: InferenceContext
): Promise<InferenceResult> {
    const tools: ToolDefinition[] = ctx.config.decisions?.tools || [];
    const target = ctx.config.inference?.name || 'local-nano';

    const payload: OpenAIChatCompletionRequest = {
        messages: [{ role: 'user', content }],
        tools: tools.length > 0 ? tools : undefined,
        stream: false,
    };

    const request: InferenceRequest = {
        target,
        payload,
    };

    const response = await fetch(defaultEndpoint, {
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

    const toolCalls = parseToolCalls(message);

    return toolCalls.length > 0
        ? toolCalls
        : (message.content || '');
}
