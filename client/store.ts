

import type { Action, Decision } from './types';

export type FunctionRegistry = Record<string, Function>;


export interface StoreInterface {
    getAction(name: string): Action | undefined;
    getDecisionByTool(toolName: string): Decision | undefined;
    executeAction(actionName: string, args: Record<string, unknown>): Promise<unknown>;
    eventTarget: EventTarget;
}



export function createResourceStore(config: { actions: Action[], decisions: Decision[] }, functions: FunctionRegistry = {}): StoreInterface {
    const actionsMap = new Map(config.actions.map(a => [a.name, a]));
    const decisionsMap = new Map(config.decisions.map(d => [d.tool, d]));
    const eventTarget = new EventTarget();

    return {
        getAction(name: string) {
            return actionsMap.get(name);
        },
        getDecisionByTool(toolName: string) {
            return decisionsMap.get(toolName);
        },
        async executeAction(actionName: string, args: Record<string, unknown>) {
            const action = actionsMap.get(actionName);
            if (!action) throw new Error(`Action not found: ${actionName}`);
            const fn = functions[actionName];
            if (!fn) throw new Error(`Function not found for action: ${actionName}`);
            // Log what action is being executed and with what args
            console.log(`[Store] Executing action: ${actionName}`);
            console.log('[Store] Args passed to function:', JSON.stringify(args, null, 2));
            // Optionally, log what is extracted if you want to show specific fields
            if (action.args && Array.isArray(action.args)) {
                const extracted: Record<string, unknown> = {};
                for (const key of action.args) {
                    extracted[key] = args[key];
                }
                console.log('[Store] Extracted args for function:', JSON.stringify(extracted, null, 2));
            }
            return await fn(args);
        },
        eventTarget
    };
}

