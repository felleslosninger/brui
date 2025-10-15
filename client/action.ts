import type { StoreInterface } from './store';
import type { ActionResult } from './brui';

export async function executeAction(
	store: StoreInterface,
	actionName: string,
	parameters: Record<string, unknown>
): Promise<ActionResult> {
	try {
		const result = await store.executeAction(
			actionName,
			parameters,
			{}
		);
		return {
			action: actionName,
			success: true,
			result
		};
	} catch (error) {
		return {
			action: actionName,
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}
