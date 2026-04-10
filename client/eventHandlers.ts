export interface ActionEvent {
    id: string;
    action: string;
}

export interface ReferenceSource {
    title: string;
    path?: string;
    lang?: string;
}

export interface ReferenceContextUsage {
    used: boolean;
    label: string;
    sources: ReferenceSource[];
}

export interface EventHandlers {
    onThinking?: (text: string) => void;
    onContentStream?: (text: string) => void;
    onReferenceContextUsed?: (referenceContext: ReferenceContextUsage) => void;
    onToolCallsKnown?: (actions: ActionEvent[]) => void;
    onActionPending?: (action: ActionEvent) => void;
    onActionStart?: (action: ActionEvent) => void;
    onActionComplete?: (action: ActionEvent, result: any) => void;
    onActionError?: (action: ActionEvent, error: string) => void;
}
