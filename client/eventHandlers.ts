export interface EventHandlers {
    onToolCallsKnown?: (actions: string[]) => void;
    onActionPending?: (action: string) => void;
    onActionStart?: (action: string) => void;
    onActionComplete?: (action: string, result: any) => void;
    onActionError?: (action: string, error: string) => void;
}