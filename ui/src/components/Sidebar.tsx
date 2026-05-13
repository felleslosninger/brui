import '../styling/sidebar.css';

import cl from 'clsx/lite';
import { useCallback, useRef, useState } from 'react';
import { SidebarContext } from './SidebarContext';
import { Mode } from '../types/message';
import SidebarOutput from './output/SidebarOutput';
import SidebarInput from './input/SidebarInput';
import { useToolRunner } from './hooks/useToolRunner';
import * as Brui from '../../../client/index';
import { FunctionRegistry } from '../../../client/index';

function getPageTextContent(excludeElement: HTMLElement): string {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                if (excludeElement.contains(node)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );
    const parts: string[] = [];
    while (walker.nextNode()) {
        const text = walker.currentNode.textContent?.trim();
        if (text) parts.push(text);
    }
    return parts.join('\n');
}

interface SidebarProps {
    children?: React.ReactNode;
    className?: string;
    config: Brui.Configuration;
    functions: FunctionRegistry;
    context?: Brui.ContextValue;
    includePageContext?: boolean;
}

function SidebarRoot({ children, className, config, functions, context, includePageContext }: SidebarProps) {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [pageContextActive, setPageContextActive] = useState(false);

    const getPageContext = useCallback(() => {
        if (!includePageContext || !pageContextActive) return undefined;
        const el = sidebarRef.current;
        if (!el) return undefined;
        return `Current page content:\n${getPageTextContent(el)}`;
    }, [includePageContext, pageContextActive]);

    const { askAI, messageHistory, pendingConfirmation, confirmActions, rejectActions, setAutoConfirm } = useToolRunner(config, functions, context, getPageContext);
    const [isLoadingResponse, setIsLoadingResponse] = useState(false);
    const [showThinking, setShowThinking] = useState(false);

    async function handleSubmitChatMessage(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);
        const inputText = String(formData.get('chatMessage') || '');
        const dropdownValue = String(formData.get('contextChoice') || '') as Mode;

        if (!inputText.trim()) return;

        form.reset();
        setIsLoadingResponse(true);

        try {
            await askAI(inputText, dropdownValue);

        } finally {
            setIsLoadingResponse(false);
        }
    }

    return (
        <SidebarContext.Provider
            value={{
                messageHistory,
                isLoadingResponse,
                showThinking,
                setShowThinking,
                handleSubmit: handleSubmitChatMessage,
                pendingConfirmation,
                confirmActions,
                rejectActions,
                setAutoConfirm,
                includePageContext,
                pageContextActive,
                setPageContextActive,
            }}
        >
            <div ref={sidebarRef} className={cl('brui-sidebar', className)}>
                {children ?? (
                    <>
                        <SidebarOutput />
                        <SidebarInput />
                    </>
                )}
            </div>
        </SidebarContext.Provider>
    );
}

const Sidebar = Object.assign(SidebarRoot, {
    Output: SidebarOutput,
    Input: SidebarInput,
});

export default Sidebar;
