import type {
    ChatCompletion,
    ChatCompletionCreateParamsNonStreaming,
    ChatCompletionCreateParamsStreaming,
    ChatCompletionMessage,
    ChatCompletionMessageFunctionToolCall,
    ChatCompletionChunk,
} from 'openai/resources/chat/completions';

export type OpenAIChatCompletionRequest = Omit<ChatCompletionCreateParamsNonStreaming, 'model'>;
export type OpenAIChatCompletionStreamingRequest = Omit<ChatCompletionCreateParamsStreaming, 'model'>;
export type OpenAIChatCompletionResponse = ChatCompletion;
export type OpenAIChatCompletionChunk = ChatCompletionChunk;
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
                arguments: parseFunctionArguments(toolCall.function.arguments, toolCall.function.name),
            },
        }));
}

function parseFunctionArguments(
    argumentsJson: string,
    toolName: string
): Record<string, unknown> {
    if (!argumentsJson || argumentsJson.trim() === '') {
        return {};
    }

    try {
        const parsed = JSON.parse(argumentsJson);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
        }

        throw new Error(`Tool "${toolName}" arguments must be a JSON object`);
    } catch (error) {
        if (error instanceof Error && error.message.includes('must be a JSON object')) {
            throw error;
        }

        throw new Error(`Tool "${toolName}" returned invalid JSON arguments`);
    }
}

function isFunctionToolCall(
    toolCall: NonNullable<OpenAIChatCompletionMessage['tool_calls']>[number]
): toolCall is OpenAIChatCompletionToolCall {
    return toolCall.type === 'function';
}
