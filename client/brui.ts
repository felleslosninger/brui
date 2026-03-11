import type { Configuration } from './types';
import type { FunctionRegistry } from './store';
import { createResourceStore } from './store';
import { Chat } from './inference';
import { EventHandlers } from "./eventHandlers";

export function Setup(config: Configuration, functions: FunctionRegistry): (input: string, metadata?: any, events?: EventHandlers) => Promise<ExecutionResult> {
    const store = createResourceStore(config, functions);

    async function processPayload(
        userInput: string,
        metadata?: any,
        events?: EventHandlers
    ): Promise<ExecutionResult> {

        try {
            const inferenceContext = {
                config: {
                    inference: config.inference?.spec,
                    decisions: { tools: config.tools }
                }
            };

            const toolCalls = await Chat(userInput, inferenceContext);

            console.log("returning tool calls:", JSON.stringify(toolCalls, null, 2));


            if (typeof toolCalls === 'string') {
                return {
                    success: true,
                    content: toolCalls
                };
            }

            if (!toolCalls || toolCalls.length === 0) {
                return {
                    success: false,
                    error: 'No tool calls returned from inference.'
                };
            }

            if (events?.onToolCallsKnown) {
                const allActions = toolCalls.flatMap(tc => {
                    const toolName = tc.function?.name;
                    return (config.decisions || [])
                        .filter((d: any) => d.tool === toolName)
                        .flatMap((d: any) => d.actions);
                });
                events.onToolCallsKnown(allActions);
            }

            const allResults: ActionResult[] = [];
            for (const toolCall of toolCalls) {
                if (!toolCall.function || !toolCall.function.name) {
                    allResults.push({
                        action: null,
                        success: false,
                        error: `Tool missing name`
                    });
                    continue;
                }

                const toolName: string = toolCall.function.name;
                const parameters: Record<string, unknown> = toolCall.function.arguments || {};

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
                    events?.onActionPending?.(actionName);

                    try {
                        events?.onActionStart?.(actionName);

                        const { result, message } = await store.executeAction(actionName, parameters);

                        events?.onActionComplete?.(actionName, { result, message });

                        allResults.push({
                            action: actionName,
                            success: true,
                            result,
                            message
                        });

                    } catch (error) {

                        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

                        events?.onActionError?.(actionName, errorMsg);

                        allResults.push({
                            action: actionName,
                            success: false,
                            error: errorMsg
                        });
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

function parseToolCall(responseText: string) {
    try {
        const data = JSON.parse(responseText);
        if (
            typeof data === "object" &&
            data.function &&
            typeof data.function.name === "string" &&
            typeof data.function.arguments === "object"
        ) {
            return data;
        } else {
            throw new Error("Invalid function call structure");
        }

    } catch (err) {
        console.warn("Rejected non-JSON or malformed input:", err.message);
        throw new Error("Unable to parse tool calls from response");
    }
}

export interface ExecutionResult {
    success: boolean;
    tool?: string;
    parameters?: Record<string, unknown>;
    executionResults?: ActionResult[];
    content?: string;
    error?: string;
}

export interface ActionResult {
    action: string;
    success: boolean;
    result?: unknown;
    message?: string;
    error?: string;
}
