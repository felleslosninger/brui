import SidebarOutput from "./output/SidebarOutput";
import SidebarInput from "./input/SidebarInput";

import "../styling/sidebar.css"

import cl from 'clsx/lite';
import { useState } from "react";

interface SidebarRootProps {
    children?: React.ReactNode;
    className?: string;
    inputHandler: (userInput: { textInput: string; contextChoice: string }) => void;
}

function SidebarRoot({ children, className, inputHandler }: SidebarRootProps) {
    const [messageHistory, setMessageHistory] = useState<string[][]>([]);
    const [questionCounter, setQuestionCounter] = useState(0);

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

        inputHandler({ textInput: inputTextStr, contextChoice: dropdownValueStr });

        event.currentTarget.reset();
    }

    return (
        <div className={cl('sidebar-content', className)}>
            {children ? (
                children
            ) : (
                <>
                    <div className="sidebar-output">
                        <Sidebar.Output messageHistory={messageHistory} />
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