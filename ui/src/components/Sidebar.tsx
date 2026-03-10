import '../styling/sidebar.css';

import cl from 'clsx/lite';
import { useState } from 'react';
<<<<<<< Updated upstream
import { Message, Mode } from "../types/message";
import { useToolRunner } from "./hooks/useToolRunner";
import { FunctionRegistry } from "../../../client";
import * as Brui from "../../../client/index"

interface SidebarRootProps {
    children?: React.ReactNode;
=======
import { SidebarContext } from './SidebarContext';
import { Message, Mode } from '../types/message';
import SidebarOutput from './output/SidebarOutput';
import SidebarInput from './input/SidebarInput';

interface SidebarProps {
    children: React.ReactNode;
>>>>>>> Stashed changes
    className?: string;
    modes: Mode[];
    config: Brui.Configuration;
    functions: FunctionRegistry;
}

<<<<<<< Updated upstream
export function SidebarRoot({ children, className, modes, config, functions }: SidebarRootProps) {
    const { askAI, messageHistory } = useToolRunner(config, functions);
=======
function SidebarRoot({ children, className, inputHandler, modes }: SidebarProps) {
    const [messageHistory, setMessageHistory] = useState<Message[]>([]);
    const [questionCounter, setQuestionCounter] = useState(0);
>>>>>>> Stashed changes
    const [isLoadingResponse, setIsLoadingResponse] = useState(false);

    async function handleSubmitChatMessage(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

<<<<<<< Updated upstream
        const formData = new FormData(event.currentTarget);
        const inputText = String(formData.get("chatMessage") || "");
        const dropdownValue = String(formData.get("contextChoice") || "") as Mode;

        if (!inputText.trim()) return;

=======
        const form = event.currentTarget;
        const formData = new FormData(form);
        const inputText = String(formData.get('chatMessage') || '');
        const dropdownValue = String(formData.get('contextChoice') || '');

        if (!inputText.trim()) return;

        // Clear the textarea immediately
        const textarea = form.querySelector<HTMLTextAreaElement>('textarea[name="chatMessage"]');
        if (textarea) textarea.value = '';

        const currentQuestionIndex = questionCounter + 1;
        setQuestionCounter(currentQuestionIndex);

        setMessageHistory(prev => [
            ...prev,
            {
                userMessage: {
                    messageIndex: currentQuestionIndex.toString(),
                    timeToComplete: 0,
                    mode: dropdownValue as Mode,
                    text: inputText
                },
                assistantMessages: []
            }
        ]);

>>>>>>> Stashed changes
        setIsLoadingResponse(true);

        try {
            await askAI(inputText, dropdownValue);

        } finally {
            setIsLoadingResponse(false);
        }
    }

    return (
<<<<<<< Updated upstream
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
=======
        <SidebarContext.Provider value={{ messageHistory, isLoadingResponse, handleSubmit: handleSubmitChatMessage, modes }}>
            <div className={cl('brui-sidebar', className)}>
                {children}
            </div>
        </SidebarContext.Provider>
>>>>>>> Stashed changes
    );
}

const Sidebar = Object.assign(SidebarRoot, {
    Output: SidebarOutput,
    Input: SidebarInput,
});

export default Sidebar;