import cl from 'clsx/lite';
import ChatBubble from "./ChatBubble";
import ChatText from "./ChatText";

interface SidebarOutputProps {
    children?: React.ReactNode;
    className?: string;
}

export default function SidebarOutputRoot({ children, className }: SidebarOutputProps) {
    return (
        <div className={cl('sidebar-output', className)}>
            {children ? (
                children
            ) : (
                <>
                    <div className="chat-row right">
                        <SidebarOutput.ChatText>hey</SidebarOutput.ChatText>
                    </div>
                    <div className="chat-row">
                        <SidebarOutput.ChatBubble>hey hey hey hey</SidebarOutput.ChatBubble>
                    </div>
                </>
            )}
        </div>
    );
}

const SidebarOutput = Object.assign(SidebarOutputRoot, {
    ChatText: ChatText,
    ChatBubble: ChatBubble,
});