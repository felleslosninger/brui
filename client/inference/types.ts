import type {
    ChatCompletion,
    ChatCompletionCreateParamsNonStreaming,
    ChatCompletionMessage,
    ChatCompletionMessageFunctionToolCall,
} from 'openai/resources/chat/completions';

export type OpenAIChatCompletionRequest = Omit<ChatCompletionCreateParamsNonStreaming, 'model'>;
export type OpenAIChatCompletionResponse = ChatCompletion;
export type OpenAIChatCompletionMessage = ChatCompletionMessage;
export type OpenAIChatCompletionToolCall = ChatCompletionMessageFunctionToolCall;

export interface InferenceToolCall {
    id?: string;
    type?: string;
    function?: {
        name: string;
        arguments?: Record<string, unknown>;
    };
}

export interface InferenceRequest {
    target: string;
    payload: OpenAIChatCompletionRequest;
}

export function parseToolCalls(message: OpenAIChatCompletionMessage): InferenceToolCall[] {
    return (message.tool_calls || [])
        .filter(isFunctionToolCall)
        .map((toolCall) => ({
            id: toolCall.id,
            type: toolCall.type,
            function: {
                name: toolCall.function.name,
                arguments: parseFunctionArguments(toolCall.function.arguments),
            },
        }));
}

function parseFunctionArguments(argumentsJson: string): Record<string, unknown> {
    if (!argumentsJson || argumentsJson.trim() === '') {
        return {};
    }

    try {
        const parsed = JSON.parse(argumentsJson);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
        }

        return {};
    } catch {
        return {};
    }
}

function isFunctionToolCall(
    toolCall: NonNullable<OpenAIChatCompletionMessage['tool_calls']>[number]
): toolCall is OpenAIChatCompletionToolCall {
    return toolCall.type === 'function';
}
