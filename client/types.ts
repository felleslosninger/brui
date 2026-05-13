import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export type JsonPrimitive = string | number | boolean | null;

export interface JsonObject {
    [key: string]: JsonValue;
}

export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type ContextValue = JsonValue;

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
    label?: string;
    message?: string;
    skipConfirmation?: boolean;
}

export interface Option {
    name: string;
}

export interface Inference extends Resource {
    kind: 'inference';
    spec: {
        name: string;
        endpoint: string;
    };
}

export interface Configuration {
    tools: ToolDefinition[];
    actions: Action[];
    decisions: Decision[];
    inference?: Inference;
}
