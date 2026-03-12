import { requestOpenAIInference } from './inference/providers/openai';
import type { ToolDefinition } from './types';
import type { InferenceToolCall } from './inference/types';

export interface InferenceContext {
    config: {
        inference?: {
            name: string;
        };
        decisions?: {
            tools?: ToolDefinition[];
        };
    };
}

export type InferenceResult = InferenceToolCall[] | string;

export async function Chat(content: string, ctx: InferenceContext): Promise<InferenceResult> {
    return requestOpenAIInference(content, ctx);
}
