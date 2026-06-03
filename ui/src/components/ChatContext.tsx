import { createContext, useContext, type FormEvent, type RefObject } from 'react';
import type { Message } from '../types/message';
import type { PendingConfirmation } from './hooks/useToolRunner';
import type { PlannedActionEvent } from '@digdir/brui-client';
import type { MicSession } from './hooks/useMicSession';

export interface ChatContextValue {
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
    inputValue: string;
    setInputValue: (value: string) => void;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    mic: MicSession;
}

export const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
    const ctx = useContext(ChatContext);
    if (!ctx) {
        throw new Error('Chat compound components must be used within <Brui>');
    }
    return ctx;
}
