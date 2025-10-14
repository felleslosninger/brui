import cl from 'clsx/lite';
import ChatBubble from "./ChatBubble";
import ChatText from "./ChatText";

interface SidebarOutputProps {
    children?: React.ReactNode;
    className?: string;
    messageHistory: string[][];
}

export default function SidebarOutputRoot({ children, className, messageHistory }: SidebarOutputProps) {
    return (
        <div className={cl('sidebar-output', className)}>
            {children ? (
                children
            ) : (
                <>
                    {messageHistory.map((item, index) => {
                        const [type, , text] = item;

                        if (type === 'Q') {
                            return (
                                <div className="chat-row right" key={index}>
                                    <SidebarOutput.ChatText>{text}</SidebarOutput.ChatText>
                                </div>
                            );
                        } else if (type === 'A') {
                            return (
                                <div className="chat-row" key={index}>
                                    <SidebarOutput.ChatBubble>{text}</SidebarOutput.ChatBubble>
                                </div>
                            );
                        } else {
                            return null;
                        }
                    })}
                </>
            )}
        </div>
    );
}

const SidebarOutput = Object.assign(SidebarOutputRoot, {
    ChatText: ChatText,
    ChatBubble: ChatBubble,
});