import type { Configuration } from './types';
import type { FunctionRegistry, StoreInterface } from './store';
import { createResourceStore } from './store';
import { selectOption, extractParameters } from './option';
import { evaluateAndExecute } from './decision';

export function Setup(config: Configuration, functions: FunctionRegistry): (input: string, metadata?: any) => Promise<ExecutionResult> {
    const store = createResourceStore(config, functions);

    async function processPayload(payload: string): Promise<ExecutionResult> {
        console.log('[Core] Processing payload:', payload);
        try {
            const result = await executeQuery(store, payload, config);
            console.log('[Core] Payload processed:', result.success ? 'success' : 'failed');
            return result;
        } catch (error) {
            console.error('[Core] Error processing payload:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    return processPayload;
}

export async function executeQuery(
    store: StoreInterface,
    userQuery: string,
    config: Configuration
): Promise<ExecutionResult> {
    try {
        console.log('[Core] Step 1: Selecting option...');
        const selectedOption = await selectOption(config.options, userQuery, config);
        
        if (!selectedOption) {
            console.log('[Core] No option selected');
            return {
                success: false,
                error: 'No option selected'
            };
        }
        
        console.log('[Core] Option selected:', selectedOption.name);
        console.log('[Core] Step 2: Extracting parameters...');
        const parameters = await extractParameters(userQuery, selectedOption, config);
        
        console.log('[Core] Parameters extracted:', parameters);
        console.log('[Core] Step 3: Finding decisions...');
        const decisions = store.getDecisionsByOption(selectedOption.name);
        
        console.log('[Core] Decisions found:', decisions.length);
        console.log('[Core] Step 4: Executing actions...');
        const results = await evaluateAndExecute(
            store,
            decisions,
            parameters,
        );
        
        console.log('[Core] Actions executed:', results.length);
        
        return {
            success: true,
            option: selectedOption.name,
            parameters,
            executionResults: results
        };
        
    } catch (error) {
        console.error('[Core] executeQuery error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}


export interface ExecutionResult {
    success: boolean;
    option?: string;
    parameters?: Record<string, unknown>;
    executionResults?: ActionResult[];
    error?: string;
}

export interface ActionResult {
    action: string;
    success: boolean;
    result?: unknown;
    error?: string;
}
