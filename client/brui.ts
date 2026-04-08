import type { Configuration } from './types';
import type { FunctionRegistry } from './store';
import type { ActionEvent, EventHandlers } from './eventHandlers';
import { createResourceStore } from './store';
import { Chat } from './inference';

export function Setup(
    config: Configuration,
    functions: FunctionRegistry
): (input: string, metadata?: unknown, events?: EventHandlers) => Promise<ExecutionResult> {
    const store = createResourceStore(config, functions);

    async function processPayload(
        userInput: string,
        _metadata?: unknown,
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
                    success: false,
                    error: toolCalls || 'No tool calls returned from inference.'
                };
            }

            if (!toolCalls || toolCalls.length === 0) {
                return {
                    success: false,
                    error: 'No tool calls returned from inference.'
                };
            }

            const allResults: ActionResult[] = [];
            const plannedActions: PlannedAction[] = [];
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

                plannedActions.push(
                    ...actionNames.map((actionName) => ({
                        event: {
                            id: crypto.randomUUID(),
                            action: actionName,
                        },
                        parameters,
                    }))
                );
            }

            if (events?.onToolCallsKnown) {
                events.onToolCallsKnown(plannedActions.map(({ event }) => event));
            }

            for (const plannedAction of plannedActions) {
                events?.onActionPending?.(plannedAction.event);

                try {
                    events?.onActionStart?.(plannedAction.event);

                    const { result, message } = await store.executeAction(
                        plannedAction.event.action,
                        plannedAction.parameters
                    );

                    events?.onActionComplete?.(plannedAction.event, { result, message });

                    allResults.push({
                        id: plannedAction.event.id,
                        action: plannedAction.event.action,
                        success: true,
                        result,
                        message
                    });

                } catch (error) {

                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

                    events?.onActionError?.(plannedAction.event, errorMsg);

                    allResults.push({
                        id: plannedAction.event.id,
                        action: plannedAction.event.action,
                        success: false,
                        error: errorMsg
                    });
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
    content?: string;
    error?: string;
}

export interface ActionResult {
    id?: string;
    action: string | null;
    success: boolean;
    result?: unknown;
    message?: string;
    error?: string;
}

interface PlannedAction {
    event: ActionEvent;
    parameters: Record<string, unknown>;
}
