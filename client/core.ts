import type { Configuration, Decision, Option } from './types';
import type { FunctionRegistry, StoreInterface } from './store';
import { createResourceStore } from './store';
import { Chat } from './inference';
import type { Tool } from 'ollama';

export async function Setup(configSource: string | Configuration, functions: FunctionRegistry): Promise<(input: string, metadata?: any) => Promise<ExecutionResult>> {
    const store = typeof configSource === 'string' 
        ? await createResourceStore(configSource, functions)
        : createResourceStore(configSource, functions);

    const config: Configuration = {
        options: store.getAll('option') as any,
        actions: store.getAll('action') as any,
        decisions: store.getAll('decision') as any,
        inference: store.get('inference', 'default') as any
    };

    // Expose a processMessage handler
    async function processMessage(query: string, metadata?: any): Promise<ExecutionResult> {
        console.log('[Core] Processing query:', query);
        try {
            const result = await executeQuery(store, query, config);
            console.log('[Core] Query executed:', result.success ? 'success' : 'failed');
            return result;
        } catch (error) {
            console.error('[Core] Error processing query:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    return processMessage;
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

async function selectOption(
    options: Option[],
    userQuery: string,
    config: Configuration
): Promise<Option | null> {
    const tools: Tool[] = options.map(opt => ({
        type: 'function',
        function: {
            name: opt.name,
            description: opt.spec.function.description,
            parameters: opt.spec.function.parameters
        }
    }));
    
    const inferenceContext = {
        config: {
            inference: config.inference?.spec,
            decisions: { tools }
        }
    };
    
    const prompt = `Select the appropriate tool for: ${userQuery}`;
    const toolCalls = await Chat(prompt, inferenceContext);
    
    if (!toolCalls || toolCalls.length === 0) {
        return null;
    }
    
    const selectedTool = toolCalls[0];
    const matchingOption = options.find(opt => opt.name === selectedTool.function.name);
    
    return matchingOption || null;
}

async function extractParameters(
    userQuery: string,
    option: Option,
    config: Configuration
): Promise<Record<string, unknown>> {
    const tools: Tool[] = [{
        type: 'function',
        function: {
            name: option.spec.function.name,
            description: option.spec.function.description,
            parameters: option.spec.function.parameters
        }
    }];
    
    const inferenceContext = {
        config: {
            inference: config.inference?.spec,
            decisions: { tools }
        }
    };
    
    const prompt = `Extract parameters for ${option.spec.function.name}: ${userQuery}`;
    const toolCalls = await Chat(prompt, inferenceContext);
    
    if (!toolCalls || toolCalls.length === 0) {
        return {};
    }

    return toolCalls[0].function.arguments || {};
}

async function evaluateAndExecute(
    store: StoreInterface,
    decisions: Decision[],
    parameters: Record<string, unknown>,
): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    
    for (const decision of decisions) {
        for (const actionName of decision.spec.then) {
            const result = await store.executeAction(
                actionName,
                parameters,
                {}
            );
            
            results.push({
                action: actionName,
                success: true,
                result
            });
        }
    }
    
    return results;
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
