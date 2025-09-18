import type { Tool } from './tool';

export interface Action {
    tool: Tool;
    triggers: [{
        type: 'function' | 'event';
        name: string;
    }];
    metadata: Record<string, any>;
}
