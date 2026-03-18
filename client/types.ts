import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export interface Resource {
    kind: string;
    name: string;
    metadata?: Record<string, unknown>;
    spec: Record<string, unknown>;
}

export interface Decision {
    tool: string;
    actions: string[];
}

export type ToolDefinition = ChatCompletionTool;

export interface Action {
    name: string;
    type: 'function' | 'event';
    args: string[];
    message?: string;
}

export interface Option {
    name: string;
}

export interface Inference extends Resource {
    kind: 'inference';
    spec: {
        name: string;
        endpoint?: string;
    };
}

export interface Configuration {
    tools: ToolDefinition[];
    actions: Action[];
    decisions: Decision[];
    inference?: Inference;
}
