import { Request } from './inference/ollama';
import type { Tool } from 'ollama';

export interface InferenceContext {
    config: {
        inference?: {
            name: string;
            provider: string;
        };
        decisions?: {
            tools?: Tool[];
        };
    };
}

export async function Chat(content: string, ctx: InferenceContext): Promise<any> {
    const provider = ctx.config.inference?.provider || 'ollama';
    
    if (provider === 'ollama') {
        return await Request(content, ctx);
    } else {
        throw new Error(`Unsupported provider: ${provider}`);
    }
}