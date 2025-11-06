import type { Configuration } from './types';
import type { FunctionRegistry } from './store';
import { createResourceStore } from './store';
import { Chat } from './inference';


export function Setup(config: Configuration, functions: FunctionRegistry): (input: string, metadata?: any) => Promise<ExecutionResult> {
    const store = createResourceStore(config, functions);

    async function processPayload(userInput: string): Promise<ExecutionResult> {
        try {
            const inferenceContext = {
                config: {
                    inference: config.inference?.spec,
                    decisions: { tools: config.tools }
                }
            };
            const toolCalls = await Chat(userInput, inferenceContext);
            if (!toolCalls || toolCalls.length === 0) {
                return {
                    success: false,
                    error: 'No tool calls returned from inference.'
                };
            }

            const allResults: ActionResult[] = [];
            for (const toolCall of toolCalls) {
                const toolName: string = toolCall.function.name;
                const parameters: Record<string, unknown> = toolCall.function.arguments || {};

                console.log('Tool called from ollama:', toolName, 'Args:', parameters);
                const decisions = (config.decisions || []).filter((d: any) => d.tool === toolName);
                if (!decisions.length) {
                    allResults.push({
                        action: toolName,
                        success: false,
                        error: `No decision found for tool: ${toolName}`
                    });
                    continue;
                }

                const actionNames = decisions.flatMap((d: any) => d.actions);
                for (const actionName of actionNames) {
                    try {
                        const { result, message } = await store.executeAction(actionName, parameters);
                        allResults.push({ action: actionName, success: true, result, message });
                    } catch (error) {
                        allResults.push({ action: actionName, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
                    }
                }
            }

            return {
                success: true,
                executionResults: allResults
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    return processPayload;
}



export interface ExecutionResult {
    success: boolean;
    tool?: string;
    parameters?: Record<string, unknown>;
    executionResults?: ActionResult[];
    error?: string;
}

export interface ActionResult {
    action: string;
    success: boolean;
    result?: unknown;
    message?: string;
    error?: string;
}
