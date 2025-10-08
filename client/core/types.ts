export interface Resource {
    kind: string;
    name: string;
    metadata?: Record<string, unknown>;
    spec: Record<string, unknown>;
}

export interface Option extends Resource {
    kind: 'option';
    type: 'tool';
    spec: {
        type: 'function';
        function: {
            name: string;
            description: string;
            parameters: Record<string, unknown>;
        };
    };
}

export interface Decision extends Resource {
    kind: 'decision';
    spec: {
        if: string[];
        then: string[];
    };
}

export interface Action extends Resource {
    kind: 'action';
    type: 'function' | 'event';
    spec: Record<string, unknown>;
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
    options: Option[];
    actions: Action[];
    decisions: Decision[];
    inference?: Inference;
}
