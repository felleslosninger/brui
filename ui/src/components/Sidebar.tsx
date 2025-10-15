import SidebarOutput from './output/SidebarOutput';
import SidebarInput from './input/SidebarInput';

import '../styling/sidebar.css'

import cl from 'clsx/lite';
import { useState } from 'react';

type AIResponseCallback = (executionResults: any, error: any) => void

interface SidebarRootProps {
    children?: React.ReactNode;
    className?: string;
    inputHandler: (userInput: { textInput: string; contextChoice: string }, onResponse?: AIResponseCallback) => void;
}

function SidebarRoot({ children, className, inputHandler }: SidebarRootProps) {
    const [messageHistory, setMessageHistory] = useState<string[][]>([]);
    const [questionCounter, setQuestionCounter] = useState(0);
    const [isLoadingResponse, setIsLoadingResponse] = useState(false);

    function handleSubmitChatMessage(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const inputText = formData.get('chatMessage');
        const dropdownValue = formData.get('contextChoice');

        const inputTextStr = inputText ? String(inputText) : '';
        const dropdownValueStr = dropdownValue ? String(dropdownValue) : '';

        if (!inputTextStr) {
            return
        }

        const currentQuestionIndex = questionCounter + 1;
        setQuestionCounter(currentQuestionIndex);

        setMessageHistory((prev) => [
            ...prev,
            ['Q', currentQuestionIndex.toString(), inputTextStr],
        ]);

        setIsLoadingResponse(true);

        inputHandler(
            { textInput: inputTextStr, contextChoice: dropdownValueStr },
            (executionResults, error) => {
                if (error) {
                    console.error('Chat error:', error);

                    setMessageHistory((prev) => [
                        ...prev,
                        ['A', currentQuestionIndex.toString(), `Error: ${error}`],
                    ]);

                    setIsLoadingResponse(false);
                    return;
                }

                const descriptions = executionResults
                    ?.map((r: { success: any; error: any; action: any; description: any; }) => {
                        if (!r.success || r.error) {
                            return `Error in ${r.action}: ${r.error || 'Unknown error'}`;
                        }
                        return r.description || r.action;
                    })
                    .join('; ') || 'No actions performed';

                setMessageHistory((prev) => [
                    ...prev,
                    ['A', currentQuestionIndex.toString(), descriptions],
                ]);
                setIsLoadingResponse(false);
            }
        );

        event.currentTarget.reset();
    }

    return (
        <div className={cl('sidebar-content', className)}>
            {children ? (
                children
            ) : (
                <>
                    <div className="sidebar-output">
                        <Sidebar.Output messageHistory={messageHistory} isLoadingResponse={isLoadingResponse} />
                    </div>

                    <div className="sidebar-input">
                        <Sidebar.Input onSubmit={handleSubmitChatMessage} />
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