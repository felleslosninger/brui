import { createContext, useContext, type FormEvent } from 'react';
import type { Message } from '../types/message';

export interface SidebarContextValue {
    messageHistory: Message[];
    isLoadingResponse: boolean;
    showThinking: boolean;
    setShowThinking: (value: boolean) => void;
    handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebarContext() {
    const ctx = useContext(SidebarContext);
    if (!ctx) {
        throw new Error('Sidebar compound components must be used within <Sidebar>');
    }
    return ctx;
}
