import SidebarOutput from "./output/SidebarOutput";
import SidebarInput from "./input/SidebarInput";

import "../styling/sidebar.css"

import cl from 'clsx/lite';

interface SidebarRootProps {
    children?: React.ReactNode;
    className?: string;
    inputHandler: (userInput: { textInput: string; contextChoice: string }) => void;
}

function SidebarRoot({ children, className, inputHandler }: SidebarRootProps) {
    function handleSubmitChatMessage(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const inputText = formData.get('chatMessage');
        const dropdownValue = formData.get('contextChoice');

        inputHandler({ textInput: inputText as string, contextChoice: dropdownValue as string });
    }

    return (
        <div className={cl('sidebar-content', className)}>
            {children ? (
                children
            ) : (
                <>
                    <div className="sidebar-output">
                        <Sidebar.Output />
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