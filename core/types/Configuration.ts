import type { Inference } from './index'
import type { Tool } from './tool';

interface Trigger {
    type: 'function' | 'event';
    name: string;
}

export interface Configuration {
    actions: Record<string, {
        tool: Tool;
        triggers: Trigger[];
        metadata: Record<string, any>;
    }>;
    triggers: Map<'function' | 'event', Function[]>;
    inference: Inference;
}
