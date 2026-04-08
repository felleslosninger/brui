export interface ActionEvent {
    id: string;
    action: string;
}

export interface EventHandlers {
    onToolCallsKnown?: (actions: ActionEvent[]) => void;
    onActionPending?: (action: ActionEvent) => void;
    onActionStart?: (action: ActionEvent) => void;
    onActionComplete?: (action: ActionEvent, result: any) => void;
    onActionError?: (action: ActionEvent, error: string) => void;
}
