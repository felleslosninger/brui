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

export type Resources = Resource[];

export interface Configuration {
    tools: any[];
    actions: Action[];
    decisions: { tool: string; actions: string[] }[];
    inference?: Inference;
}