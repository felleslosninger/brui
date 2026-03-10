import { createContext, useContext, type FormEvent } from 'react';
import type { Message, Mode } from '../types/message';

export interface SidebarContextValue {
    messageHistory: Message[];
    isLoadingResponse: boolean;
    handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
    modes: Mode[];
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebarContext() {
    const ctx = useContext(SidebarContext);
    if (!ctx) {
        throw new Error('Sidebar compound components must be used within <Sidebar>');
    }
    return ctx;
}
