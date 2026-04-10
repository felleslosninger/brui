import { requestOpenAIInference, requestOpenAITextResponse } from './inference/providers/openai';
import type { StreamCallbacks } from './inference/providers/openai';
import type { ContextValue, ToolDefinition } from './types';
import type { InferenceToolCall } from './inference/types';
import type { PreparedReferenceContext } from './inference/referenceContext';

export type { StreamCallbacks } from './inference/providers/openai';

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

export type InteractionMode = 'Info' | 'Act';

export interface InferenceContext {
    config: {
        inference?: {
            name: string;
            endpoint?: string;
        };
        decisions?: {
            tools?: ToolDefinition[];
        };
    };
    conversationHistory?: ConversationMessage[];
    interactionMode?: InteractionMode;
    context?: ContextValue;
    referenceContext?: PreparedReferenceContext | null;
}

export type InferenceResult = InferenceToolCall[] | string;

export async function Chat(content: string, ctx: InferenceContext, callbacks?: StreamCallbacks): Promise<InferenceResult> {
    return requestOpenAIInference(content, ctx, callbacks);
}

export async function Respond(
    messages: ConversationMessage[],
    ctx: InferenceContext,
    systemPrompt: string
): Promise<string> {
    return requestOpenAITextResponse(messages, ctx, systemPrompt);
}
