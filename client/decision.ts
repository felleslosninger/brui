import type { StoreInterface } from './store';
import type { Decision } from './types';
import type { ActionResult } from './brui';
import { executeAction } from './action';

export async function evaluateAndExecute(
    store: StoreInterface,
    decisions: Decision[],
    parameters: Record<string, unknown>,
): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    for (const decision of decisions) {
        for (const actionName of decision.spec.then) {
            const result = await executeAction(
                store,
                actionName,
                parameters
            );
            results.push(result);
        }
    }
    return results;
}
