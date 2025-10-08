import type { Configuration, Decision, Option } from './types';
import type { FunctionRegistry, StoreInterface } from './store';
import { createResourceStore } from './store';
import { Chat } from './inference';
import type { Tool } from 'ollama';

export async function Setup(configSource: string | Configuration, functions: FunctionRegistry): Promise<EventTarget> {
    const store = typeof configSource === 'string' 
        ? await createResourceStore(configSource, functions)
        : createResourceStore(configSource, functions);
    
    const config: Configuration = {
        options: store.getAll('option') as any,
        actions: store.getAll('action') as any,
        decisions: store.getAll('decision') as any,
        inference: store.get('inference', 'default') as any
    };
    
    store.eventTarget.addEventListener('chat:input', async (event: any) => {
        const { query, metadata } = event.detail;
        
        console.log('[Core] Processing query:', query);
        
        try {
            const result = await executeQuery(store, query, config);
            
            console.log('[Core] Query executed:', result.success ? 'success' : 'failed');
            
            const outputEvent = new CustomEvent('chat:output', {
                detail: {
                    success: result.success,
                    option: result.option,
                    parameters: result.parameters,
                    results: result.executionResults,
                    error: result.error,
                    metadata
                }
            });
            
            store.eventTarget.dispatchEvent(outputEvent);
            
        } catch (error) {
            console.error('[Core] Error processing query:', error);
            
            const errorEvent = new CustomEvent('chat:output', {
                detail: {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    metadata
                }
            });
            
            store.eventTarget.dispatchEvent(errorEvent);
        }
    });
    
    return store.eventTarget;
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
    
    const params = toolCalls[0].function.arguments || {};
    return params;
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
