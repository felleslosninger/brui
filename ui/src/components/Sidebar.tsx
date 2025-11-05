import SidebarOutput from './output/SidebarOutput';
import SidebarInput from './input/SidebarInput';

import '../styling/sidebar.css'

import cl from 'clsx/lite';
import { useState } from 'react';

type AIResponseCallback = (executionResults: any, error: any) => void

interface SidebarRootProps {
    children?: React.ReactNode;
    className?: string;
    inputHandler: (
        userInput: { textInput: string; contextChoice: string }
    ) => Promise<{
        success: boolean;
        executionResults?: any[];
        error?: string;
    }>;
}

function SidebarRoot({ children, className, inputHandler }: SidebarRootProps) {
    const [messageHistory, setMessageHistory] = useState<string[][]>([]);
    const [questionCounter, setQuestionCounter] = useState(0);
    const [isLoadingResponse, setIsLoadingResponse] = useState(false);

    async function handleSubmitChatMessage(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const inputText = formData.get("chatMessage");
        const dropdownValue = formData.get("contextChoice");

        const inputTextStr = inputText ? String(inputText) : "";
        const dropdownValueStr = dropdownValue ? String(dropdownValue) : "";

        if (!inputTextStr) return;

        const currentQuestionIndex = questionCounter + 1;
        setQuestionCounter(currentQuestionIndex);

        // Add user question to chat
        setMessageHistory((prev) => [
            ...prev,
            ["Q", currentQuestionIndex.toString(), inputTextStr],
        ]);

        setIsLoadingResponse(true);

        try {
            const result = await inputHandler({
                textInput: inputTextStr,
                contextChoice: dropdownValueStr,
            });

            if (!result.success) {
                console.error("Chat error:", result.error);
                setMessageHistory((prev) => [
                    ...prev,
                    ["A", currentQuestionIndex.toString(), `Error: ${result.error}`],
                ]);
                return;
            }

            const responses =
                result.executionResults
                    ?.map((r: { success: boolean; error?: string; action: string; message?: string; description?: string; }) => {
                            if (!r.success || r.error) {
                                return `Error in ${r.action}: ${r.error || "Unknown error"}`;
                            }
                            return r.message || r.description || r.action;
                        }
                    )
                    .join("; ") || "No actions performed";

            setMessageHistory((prev) => [
                ...prev,
                ["A", currentQuestionIndex.toString(), responses],
            ]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessageHistory((prev) => [
                ...prev,
                ["A", currentQuestionIndex.toString(), `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,],
            ]);
        } finally {
            setIsLoadingResponse(false);
        }
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