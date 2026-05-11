import { createContext, useContext, type FormEvent } from 'react';
import type { Message } from '../types/message';
import type { PendingConfirmation } from './hooks/useToolRunner';
import type { PlannedActionEvent } from '../../../client/eventHandlers';

export interface SidebarContextValue {
    messageHistory: Message[];
    isLoadingResponse: boolean;
    showThinking: boolean;
    setShowThinking: (value: boolean) => void;
    handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
    pendingConfirmation: PendingConfirmation | null;
    confirmActions: (editedActions?: PlannedActionEvent[]) => void;
    rejectActions: () => void;
    setAutoConfirm: (value: boolean) => void;
    includePageContext?: boolean;
    pageContextActive: boolean;
    setPageContextActive: (value: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebarContext() {
    const ctx = useContext(SidebarContext);
    if (!ctx) {
        throw new Error('Sidebar compound components must be used within <Sidebar>');
    }
    return ctx;
}
