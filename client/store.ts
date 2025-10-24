import type { Action, Decision } from './types';

export type FunctionRegistry = Record<string, Function>;

export interface StoreInterface {
    getAction(name: string): Action | undefined;
    getDecisionByTool(toolName: string): Decision | undefined;
    executeAction(actionName: string, args: Record<string, unknown>): Promise<unknown>;
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
            if (action.args && Array.isArray(action.args)) {
                const extracted: Record<string, unknown> = {};
                for (const key of action.args) {
                    extracted[key] = args[key];
                }
                console.log('[Store] Extracted args for function:', JSON.stringify(extracted, null, 2));
            }
            console.log("ARGS HERE: ", args)
            return await fn(args.value);
        }
    };
    if (config.useEventTarget) {
        store.eventTarget = new EventTarget();
    }
    return store;
}

