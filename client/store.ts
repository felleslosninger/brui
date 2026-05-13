import type { Action, Decision } from './types';

export type ActionFunction = (
    args: Record<string, unknown>
) => unknown | Promise<unknown>;

export type FunctionRegistry = Record<string, ActionFunction>;

export interface ExecuteActionResult {
    result: unknown;
    message?: string;
    args?: Record<string, unknown>;
}

export interface StoreInterface {
    getAction(name: string): Action | undefined;
    getDecisionByTool(toolName: string): Decision | undefined;
    executeAction(
        actionName: string,
        args: Record<string, unknown>
    ): Promise<ExecuteActionResult>;
}

export function createResourceStore(
    config: { actions: Action[]; decisions: Decision[] },
    functions: FunctionRegistry = {}
): StoreInterface {
    const actionsMap = new Map(config.actions.map((a) => [a.name, a]));
    const decisionsMap = new Map(config.decisions.map((d) => [d.tool, d]));

    return {
        getAction(name) {
            return actionsMap.get(name);
        },
        getDecisionByTool(toolName) {
            return decisionsMap.get(toolName);
        },
        async executeAction(actionName, args) {
            const action = actionsMap.get(actionName);
            if (!action) throw new Error(`Action not found: ${actionName}`);
            const fn = functions[actionName];
            if (!fn) throw new Error(`Function not found for action: ${actionName}`);

            const extracted: Record<string, unknown> = Array.isArray(action.args)
                ? Object.fromEntries(action.args.map((key) => [key, args[key]]))
                : args;

            const result = await fn(extracted);

            const message = action.message
                ? action.message.replace(/\{(\w+)}/g, (_, key) => {
                    const val = extracted[key];
                    return val !== undefined ? String(val) : `{${key}}`;
                })
                : '';

            return { result, message, args: extracted };
        },
    };
}
