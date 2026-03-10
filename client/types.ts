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

export interface FunctionParameter {
    type: string;
    description?: string;
    enum?: string[];
    items?: FunctionParameter;
    properties?: Record<string, FunctionParameter | undefined>;
    required?: string[];
    additionalProperties?: boolean | FunctionParameter;
}

interface Tool {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: FunctionParameter;
    };
}

export interface Action {
    name: string;
    type: 'function' | 'event';
    args: string[];
    message?: string;
}

export interface Inference extends Resource {
    kind: 'inference';
    spec: {
        name: string;
        provider: string;
    };
}

export interface Configuration {
    tools: Tool[];
    actions: Action[];
    decisions: { tool: string; actions: string[] }[];
    inference?: Inference;
}