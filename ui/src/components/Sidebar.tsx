import '../styling/sidebar.css';

import cl from 'clsx/lite';
import { useState } from 'react';
import { SidebarContext } from './SidebarContext';
import { Mode } from '../types/message';
import SidebarOutput from './output/SidebarOutput';
import SidebarInput from './input/SidebarInput';
import { useToolRunner } from './hooks/useToolRunner';
import * as Brui from '../../../client/index';
import { FunctionRegistry } from '../../../client/index';

interface SidebarProps {
    children?: React.ReactNode;
    className?: string;
    config: Brui.Configuration;
    functions: FunctionRegistry;
    context?: Brui.ContextValue;
}

function SidebarRoot({ children, className, config, functions, context }: SidebarProps) {
    const { askAI, messageHistory } = useToolRunner(config, functions, context);
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
            }}
        >
            <div className={cl('brui-sidebar', className)}>
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
