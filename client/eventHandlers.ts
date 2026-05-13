export type { ReferenceSource, ReferenceContextUsage } from './inference/referenceContext';
import type { ReferenceContextUsage } from './inference/referenceContext';

export interface ActionEvent {
    id: string;
    action: string;
    skipConfirmation?: boolean;
}

export interface PlannedActionEvent extends ActionEvent {
    label?: string;
    parameters: Record<string, unknown>;
}

export interface ActionCompletionResult {
    result: unknown;
    message?: string;
}

export interface EventHandlers {
    onThinking?: (text: string) => void;
    onContentStream?: (text: string) => void;
    onReferenceContextUsed?: (referenceContext: ReferenceContextUsage) => void;
    onToolCallsKnown?: (actions: ActionEvent[]) => void;
    onConfirmActions?: (actions: PlannedActionEvent[]) => Promise<PlannedActionEvent[] | false>;
    onActionPending?: (action: ActionEvent) => void;
    onActionStart?: (action: ActionEvent) => void;
    onActionComplete?: (action: ActionEvent, result: ActionCompletionResult) => void;
    onActionError?: (action: ActionEvent, error: string) => void;
}
