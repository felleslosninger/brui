import type { StoreInterface } from './store';
import type { Decision } from './types';
import type { ActionResult } from './brui';
import { executeAction } from './action';

// Is this still used?

export async function evaluateAndExecute(
    store: StoreInterface,
    decisions: Decision[],
    parameters: Record<string, unknown>,
): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    for (const decision of decisions) {
        const result = await executeAction(
            store,
            decision.name,
            parameters
        );
        results.push(result);
    }
    return results;
}