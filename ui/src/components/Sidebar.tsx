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
    modes: Mode[];
    config: Brui.Configuration;
    functions: FunctionRegistry;
}

function SidebarRoot({ children, className, modes, config, functions }: SidebarProps) {
    const { askAI, messageHistory } = useToolRunner(config, functions);
    const [isLoadingResponse, setIsLoadingResponse] = useState(false);

    async function handleSubmitChatMessage(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);
        const inputText = String(formData.get('chatMessage') || '');
        const dropdownValue = String(formData.get('contextChoice') || '') as Mode;

        if (!inputText.trim()) return;

        setIsLoadingResponse(true);

        try {
            await askAI(inputText, dropdownValue);

        } finally {
            setIsLoadingResponse(false);
        }
    }

    return (
        <SidebarContext.Provider value={{ messageHistory, isLoadingResponse, handleSubmit: handleSubmitChatMessage, modes }}>
            <div className={cl('brui-sidebar', className)}>
                {children}
            </div>
        </SidebarContext.Provider>
    );
}

const Sidebar = Object.assign(SidebarRoot, {
    Output: SidebarOutput,
    Input: SidebarInput,
});

export default Sidebar;