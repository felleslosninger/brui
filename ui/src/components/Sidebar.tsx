import SidebarOutput from './output/SidebarOutput';
import SidebarInput from './input/SidebarInput';

import '../styling/sidebar.css'

import cl from 'clsx/lite';
import { useState } from 'react';
import { Mode } from "../types/message";
import { useToolRunner } from "./hooks/useToolRunner";
import { FunctionRegistry } from "../../../client";
import * as Brui from "../../../client/index"

interface SidebarRootProps {
    children?: React.ReactNode;
    className?: string;
    modes: Mode[];
    config: Brui.Configuration;
    functions: FunctionRegistry;
}

export function SidebarRoot({ children, className, modes, config, functions }: SidebarRootProps) {
    const { askAI, messageHistory } = useToolRunner(config, functions);
    const [isLoadingResponse, setIsLoadingResponse] = useState(false);

    async function handleSubmitChatMessage(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const inputText = String(formData.get("chatMessage") || "");
        const dropdownValue = String(formData.get("contextChoice") || "") as Mode;

        if (!inputText.trim()) return;

        setIsLoadingResponse(true);

        try {
            askAI(inputText, dropdownValue);

        } finally {
            setIsLoadingResponse(false);
        }
    }

    return (
        <div className={cl("sidebar-content", className)}>
            {children ? (
                children
            ) : (
                <>
                    <div className="sidebar-output">
                        <Sidebar.Output
                            messageHistory={messageHistory}
                            isLoadingResponse={isLoadingResponse}
                        />
                    </div>

                    <div className="sidebar-input">
                        <Sidebar.Input onSubmit={handleSubmitChatMessage} modes={modes} />
                    </div>
                </>
            )}
        </div>
    );
}

const Sidebar = Object.assign(SidebarRoot, {
    Output: SidebarOutput,
    Input: SidebarInput,
});

export default Sidebar;