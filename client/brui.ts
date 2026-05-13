import type { Configuration, ContextValue, Decision } from './types';
import type { FunctionRegistry, StoreInterface } from './store';
import type { ActionEvent, EventHandlers, ReferenceContextUsage } from './eventHandlers';
import type { ConversationMessage, InferenceContext, InteractionMode, StreamCallbacks } from './inference';
import type { InferenceToolCall } from './inference/types';
import type { PreparedReferenceContext } from './inference/referenceContext';
import { createResourceStore } from './store';
import { Chat, Respond } from './inference';
import { appendReferenceSources, mergeReferenceContexts, preparePageReferenceContext, prepareReferenceContext } from './inference/referenceContext';

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

    return async function processPayload(
        userInput: string,
        metadata?: ExecutionMetadata,
        events?: EventHandlers
    ): Promise<ExecutionResult> {
        try {
            const referenceContext = buildReferenceContext(metadata, userInput);
            const inferenceContext = buildInferenceContext(config, metadata, referenceContext);

            if (referenceContext) {
                events?.onReferenceContextUsed?.(toUsage(referenceContext)!);
            }

            const toolCalls = await Chat(userInput, inferenceContext, makeStreamCallbacks(events));

            if (typeof toolCalls === 'string') {
                return handleTextResponse(toolCalls, referenceContext);
            }

            if (!toolCalls || toolCalls.length === 0) {
                return { success: false, error: 'No tool calls returned from inference.' };
            }

            const { plannedActions, allResults } = planActions(toolCalls, config);

            events?.onToolCallsKnown?.(plannedActions.map(({ event }) => event));

            const cancelled = await confirmPlannedActions(plannedActions, events);
            if (cancelled) {
                return { success: false, error: 'Actions were cancelled by the user.' };
            }

            await runPlannedActions(plannedActions, store, events, allResults);

            const content = await summarizeResults(userInput, allResults, inferenceContext);

            return {
                success: true,
                executionResults: allResults,
                content: appendReferenceSources(content, referenceContext),
                referenceContext: toUsage(referenceContext),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    };
}

function buildReferenceContext(
    metadata: ExecutionMetadata | undefined,
    userInput: string
): PreparedReferenceContext | null {
    const docContext = prepareReferenceContext(metadata?.context, userInput);
    const pageContext = preparePageReferenceContext(metadata?.pageContext, userInput);
    return mergeReferenceContexts(docContext, pageContext);
}

function buildInferenceContext(
    config: Configuration,
    metadata: ExecutionMetadata | undefined,
    referenceContext: PreparedReferenceContext | null
): InferenceContext {
    return {
        config: {
            inference: config.inference?.spec,
            decisions: { tools: config.tools },
        },
        conversationHistory: metadata?.conversationHistory,
        interactionMode: metadata?.interactionMode,
        context: metadata?.context,
        referenceContext,
    };
}

function makeStreamCallbacks(events?: EventHandlers): StreamCallbacks {
    return {
        onThinking: events?.onThinking ? (text) => events.onThinking!(text) : undefined,
        onContentStream: events?.onContentStream ? (text) => events.onContentStream!(text) : undefined,
    };
}

function handleTextResponse(
    text: string,
    referenceContext: PreparedReferenceContext | null
): ExecutionResult {
    const content = text.trim();
    if (!content) {
        return { success: false, error: 'Inference returned no response.' };
    }
    return {
        success: true,
        content: appendReferenceSources(content, referenceContext),
        referenceContext: toUsage(referenceContext),
    };
}

function planActions(
    toolCalls: InferenceToolCall[],
    config: Configuration
): { plannedActions: PlannedAction[]; allResults: ActionResult[] } {
    const plannedActions: PlannedAction[] = [];
    const allResults: ActionResult[] = [];
    const decisions: Decision[] = config.decisions || [];

    for (const toolCall of toolCalls) {
        if (!toolCall.function || !toolCall.function.name) {
            allResults.push({ action: null, success: false, error: 'Tool missing name' });
            continue;
        }

        const toolName = toolCall.function.name;
        const parameters: Record<string, unknown> = toolCall.function.arguments || {};
        const matching = decisions.filter((d) => d.tool === toolName);

        if (!matching.length) {
            allResults.push({
                action: toolName,
                success: false,
                error: `No decision found for tool: ${toolName}`,
            });
            continue;
        }

        const actionNames = matching.flatMap((d) => d.actions);
        for (const actionName of actionNames) {
            const actionDef = (config.actions || []).find((a) => a.name === actionName);
            plannedActions.push({
                event: {
                    id: crypto.randomUUID(),
                    action: actionName,
                    label: actionDef?.label,
                    skipConfirmation: actionDef?.skipConfirmation,
                },
                parameters,
            });
        }
    }

    return { plannedActions, allResults };
}

async function confirmPlannedActions(
    plannedActions: PlannedAction[],
    events?: EventHandlers
): Promise<boolean> {
    if (!events?.onConfirmActions) return false;

    const actionsForConfirmation = plannedActions
        .filter(({ event }) => !event.skipConfirmation)
        .map(({ event, parameters }) => ({ ...event, parameters }));

    if (actionsForConfirmation.length === 0) return false;

    const result = await events.onConfirmActions(actionsForConfirmation);
    if (!result) return true;

    for (const edited of result) {
        const planned = plannedActions.find((p) => p.event.id === edited.id);
        if (planned && edited.parameters) {
            planned.parameters = edited.parameters;
        }
    }
    return false;
}

async function runPlannedActions(
    plannedActions: PlannedAction[],
    store: StoreInterface,
    events: EventHandlers | undefined,
    allResults: ActionResult[]
): Promise<void> {
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
                message,
            });
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            events?.onActionError?.(plannedAction.event, errorMsg);
            allResults.push({
                id: plannedAction.event.id,
                action: plannedAction.event.action,
                success: false,
                error: errorMsg,
            });
        }
    }
}

async function summarizeResults(
    userInput: string,
    allResults: ActionResult[],
    inferenceContext: InferenceContext
): Promise<string> {
    const fallback = buildFallbackAssistantResponse(allResults);

    try {
        const summary = await Respond(
            buildActionSummaryRequest(userInput, allResults),
            inferenceContext,
            postActionSystemPrompt
        );
        const trimmed = summary.trim();
        if (trimmed) return trimmed;
    } catch (error) {
        console.warn('Post-action summary failed:', error);
    }

    return fallback;
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
    event: ActionEvent & { label?: string };
    parameters: Record<string, unknown>;
}

export interface ExecutionMetadata {
    conversationHistory?: ConversationMessage[];
    interactionMode?: InteractionMode;
    context?: ContextValue;
    pageContext?: string;
}

function toUsage(
    referenceContext: PreparedReferenceContext | null
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
