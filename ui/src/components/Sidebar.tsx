import '../styling/sidebar.css';

import cl from 'clsx/lite';
import { useState } from 'react';
import { SidebarContext } from './SidebarContext';
import { Message, Mode } from '../types/message';
import SidebarOutput from './output/SidebarOutput';
import SidebarInput from './input/SidebarInput';

interface SidebarProps {
    children: React.ReactNode;
    className?: string;
    modes: Mode[];
    inputHandler: (
        userInput: { textInput: string; contextChoice: string }
    ) => Promise<{
        success: boolean;
        executionResults?: any[];
        error?: string;
    }>;
}

function SidebarRoot({ children, className, inputHandler, modes }: SidebarProps) {
    const [messageHistory, setMessageHistory] = useState<Message[]>([]);
    const [questionCounter, setQuestionCounter] = useState(0);
>>>>>>> Stashed changes
    const [isLoadingResponse, setIsLoadingResponse] = useState(false);

    async function handleSubmitChatMessage(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

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