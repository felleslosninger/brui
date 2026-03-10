import SidebarOutput from './output/SidebarOutput';
import SidebarInput from './input/SidebarInput';

import '../styling/sidebar.css'

import cl from 'clsx/lite';
import { useState } from 'react';
import { Message, Mode } from '../types/message';

type AIResponseCallback = (executionResults: any, error: any) => void

interface SidebarRootProps {
    children?: React.ReactNode;
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

export function SidebarRoot({ children, className, inputHandler, modes }: SidebarRootProps) {
    const [messageHistory, setMessageHistory] = useState<Message[]>([]);
    const [questionCounter, setQuestionCounter] = useState(0);
    const [isLoadingResponse, setIsLoadingResponse] = useState(false);

    async function handleSubmitChatMessage(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const inputText = String(formData.get('chatMessage') || '');
        const dropdownValue = String(formData.get('contextChoice') || '');

        if (!inputText.trim()) return;

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

        setIsLoadingResponse(true);

        try {
            const result = await inputHandler({
                textInput: inputText,
                contextChoice: dropdownValue
            });

            if (!result.success) {
                console.error('Chat error:', result.error);

                addAssistantMessage(
                    currentQuestionIndex,
                    `Error: ${result.error}`
                );

                return;
            }

            for (const r of result.executionResults ?? []) {
                if (!r.success || r.error) {
                    addAssistantMessage(
                        currentQuestionIndex,
                        `Error in ${r.action}: ${r.error || 'Unknown error'}`
                    );
                } else {
                    addAssistantMessage(
                        currentQuestionIndex,
                        r.message || r.description || r.action
                    );
                }
            }

        } catch (err) {
            console.error('Unexpected error:', err);

            addAssistantMessage(
                currentQuestionIndex,
                `Unexpected error: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        } finally {
            setIsLoadingResponse(false);
        }
    }

    function addAssistantMessage(questionIndex: number, text: string) {
        setMessageHistory(prev => {
            const updated = [...prev];
            const last = updated.length - 1;

            updated[last] = {
                ...updated[last],
                assistantMessages: [
                    ...updated[last].assistantMessages,
                    {
                        messageIndex: questionIndex.toString(),
                        timeToComplete: 0,
                        text
                    }
                ]
            };

            return updated;
        });
    }

    return (
        <div className={cl('sidebar-content', className)}>
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