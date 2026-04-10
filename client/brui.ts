import type { Configuration, ContextValue } from './types';
import type { FunctionRegistry } from './store';
import type { ActionEvent, EventHandlers, ReferenceContextUsage } from './eventHandlers';
import type { ConversationMessage, InferenceContext, InteractionMode, StreamCallbacks } from './inference';
import { createResourceStore } from './store';
import { Chat, Respond } from './inference';
import { appendReferenceSources, prepareReferenceContext } from './inference/referenceContext';

const postActionSystemPrompt = 'You are a helpful assistant that controls a web application. The relevant actions have already been executed. Reply to the user with a concise, user-facing update about what happened. Mention any failures clearly. Do not ask to repeat the action, and do not call tools.';

function formatUnknown(value: unknown): string | null {
    if (value == null) {
        return null;
    }

    if (typeof value === 'string') {
        return value;
    }

    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function formatActionResult(actionResult: ActionResult): string {
    const actionName = actionResult.action || 'unknown action';

    if (actionResult.success) {
        const detail = actionResult.message
            || formatUnknown(actionResult.result)
            || 'Completed successfully.';
        return `- ${actionName}: succeeded. ${detail}`;
    }

    return `- ${actionName}: failed. ${actionResult.error || 'Failed.'}`;
}

function buildActionSummaryRequest(
    userInput: string,
    actionResults: ActionResult[]
): ConversationMessage[] {
    const formattedResults = actionResults.map(formatActionResult).join('\n');

    return [
        {
            role: 'user',
            content: [
                `The user's latest request was: ${userInput}`,
                'The requested actions have already been executed.',
                'Action results:',
                formattedResults,
                'Write a short response to the user summarizing the outcome.',
            ].join('\n\n'),
        },
    ];
}

function buildFallbackAssistantResponse(actionResults: ActionResult[]): string {
    const successfulMessages = actionResults
        .filter((actionResult) => actionResult.success)
        .map((actionResult) => actionResult.message || `${actionResult.action || 'Action'} completed.`);

    const failedMessages = actionResults
        .filter((actionResult) => !actionResult.success)
        .map((actionResult) => actionResult.error || `${actionResult.action || 'Action'} failed.`);

    return [...successfulMessages, ...failedMessages].join(' ').trim() || 'Done.';
}

export function Setup(
    config: Configuration,
    functions: FunctionRegistry
): (input: string, metadata?: ExecutionMetadata, events?: EventHandlers) => Promise<ExecutionResult> {
    const store = createResourceStore(config, functions);

    async function processPayload(
        userInput: string,
        metadata?: ExecutionMetadata,
        events?: EventHandlers
    ): Promise<ExecutionResult> {
        try {
            const referenceContext = prepareReferenceContext(metadata?.context, userInput);
            const inferenceContext: InferenceContext = {
                config: {
                    inference: config.inference?.spec,
                    decisions: { tools: config.tools }
                },
                conversationHistory: metadata?.conversationHistory,
                interactionMode: metadata?.interactionMode,
                context: metadata?.context,
                referenceContext,
            };

            if (referenceContext) {
                events?.onReferenceContextUsed?.({
                    used: referenceContext.used,
                    label: referenceContext.label,
                    sources: referenceContext.sources,
                });
            }

            const streamCallbacks: StreamCallbacks = {
                onThinking: events?.onThinking ? (text) => events.onThinking!(text) : undefined,
                onContentStream: events?.onContentStream ? (text) => events.onContentStream!(text) : undefined,
            };

            const toolCalls = await Chat(userInput, inferenceContext, streamCallbacks);

            console.log("returning tool calls:", JSON.stringify(toolCalls, null, 2));


            if (typeof toolCalls === 'string') {
                const content = toolCalls.trim();

                if (!content) {
                    return {
                        success: false,
                        error: 'Inference returned no response.'
                    };
                }

                return {
                    success: true,
                    content: appendReferenceSources(content, referenceContext),
                    referenceContext: toReferenceContextUsage(referenceContext),
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

            let content = buildFallbackAssistantResponse(allResults);

            try {
                const summary = await Respond(
                    buildActionSummaryRequest(userInput, allResults),
                    inferenceContext,
                    postActionSystemPrompt
                );

                if (summary.trim()) {
                    content = summary.trim();
                }
            } catch (error) {
                console.warn('Post-action summary failed:', error);
            }

            return {
                success: true,
                executionResults: allResults,
                content,
                referenceContext: toReferenceContextUsage(referenceContext),
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
    referenceContext?: ReferenceContextUsage;
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

export interface ExecutionMetadata {
    conversationHistory?: ConversationMessage[];
    interactionMode?: InteractionMode;
    context?: ContextValue;
}

function toReferenceContextUsage(
    referenceContext: ReturnType<typeof prepareReferenceContext>
): ReferenceContextUsage | undefined {
    if (!referenceContext) {
        return undefined;
    }

    return {
        used: referenceContext.used,
        label: referenceContext.label,
        sources: referenceContext.sources,
    };
}
