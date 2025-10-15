import cl from 'clsx/lite';
import ChatBubble from './ChatBubble';
import ChatText from './ChatText';
import { Skeleton } from '@digdir/designsystemet-react';

interface SidebarOutputProps {
    children?: React.ReactNode;
    className?: string;
    messageHistory: string[][];
    isLoadingResponse: boolean;
}

export default function SidebarOutputRoot({ children, className, messageHistory, isLoadingResponse }: SidebarOutputProps) {
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
                            console.log('Rendering nothing!');
                            return null;
                        }
                    })}

                    {isLoadingResponse && (
                        <div className="chat-bubble-skeleton" key={'isLoadingResponse'}>
                            <Skeleton variant='rectangle' width='200px' height='80px' />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

const SidebarOutput = Object.assign(SidebarOutputRoot, {
    ChatText: ChatText,
    ChatBubble: ChatBubble,
});