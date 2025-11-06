import type { Action, Decision } from './types';

export type FunctionRegistry = Record<string, Function>;

export interface StoreInterface {
    getAction(name: string): Action | undefined;
    getDecisionByTool(toolName: string): Decision | undefined;
    executeAction(
        actionName: string,
        args: Record<string, unknown>
    ): Promise<{ result: any; message?: string; args?: Record<string, unknown> }>;
    eventTarget?: EventTarget;
}

export function createResourceStore(
    config: { actions: Action[], decisions: Decision[], useEventTarget?: boolean },
    functions: FunctionRegistry = {}
): StoreInterface {
    const actionsMap = new Map(config.actions.map((a: Action) => [a.name, a]));
    const decisionsMap = new Map(config.decisions.map((d: Decision) => [d.tool, d]));
    const store: StoreInterface = {
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

            console.log(`[Store] Executing action: ${actionName}`);
            console.log('[Store] Args passed to function:', JSON.stringify(args, null, 2));

            let extracted: Record<string, unknown> = args;
            if (action.args && Array.isArray(action.args)) {
                extracted = {};
                for (const key of action.args) {
                    extracted[key] = args[key];
                }
                console.log('[Store] Extracted args for function:', JSON.stringify(extracted, null, 2));
            }

            const result = await fn(extracted);

            let message = action.message || '';
            if (message) {
                message = message.replace(/\{(\w+)}/g, (_, key) => {
                    const val = extracted[key];
                    return val !== undefined ? String(val) : `{${key}}`;
                });
            }

            return { result, message, args: extracted };
        }
    };
    if (config.useEventTarget) {
        store.eventTarget = new EventTarget();
    }
    return store;
}

