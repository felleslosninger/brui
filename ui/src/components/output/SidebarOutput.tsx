import cl from 'clsx/lite';
import ChatBubble from './ChatBubble';
import ChatText from './ChatText';
import Stepper from './Stepper';
import { Skeleton } from '@digdir/designsystemet-react';
import { useSidebarContext } from '../SidebarContext';
import { Message } from '../../types/message';

interface SidebarOutputProps {
    children?: React.ReactNode;
    className?: string;
}

function SidebarOutputRoot({
    children,
    className,
}: SidebarOutputProps) {
    const { messageHistory, isLoadingResponse } = useSidebarContext();
    return (
        <div className={cl('brui-sidebar-output', className)}>
            {children ?? (
                <>
                    {messageHistory.map((msg: Message, index) => (
                        <div key={index}>

                            <SidebarOutput.ChatText>
                                {msg.userMessage.text}
                            </SidebarOutput.ChatText>

                            {msg.userMessage.mode === 'Info' && (
                                msg.assistantMessages.map((assistantMsg, i) => (
                                    <SidebarOutput.ChatBubble key={i}>
                                        {assistantMsg.text}
                                    </SidebarOutput.ChatBubble>
                                ))
                            )}

                            {msg.userMessage.mode === 'Act' && msg.assistantMessages.length > 0 && (
                                <SidebarOutput.Stepper
                                    controlledSteps={msg.assistantMessages.map(am => ({
                                        label: am.text,
                                        status: am.status === 'uncompleted' ? 'pending' as const
                                            : (am.status as 'completed' | 'active' | 'pending'),
                                    }))}
                                />
                            )}

                            {msg.finalResponse && (
                                <SidebarOutput.ChatBubble>
                                    {msg.finalResponse}
                                </SidebarOutput.ChatBubble>
                            )}
                        </div>
                    ))}

                    {isLoadingResponse && (
                        <div className="brui-chat-bubble-skeleton" key="isLoadingResponse">
                            <Skeleton variant="rectangle" width="200px" height="80px" />
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
    Stepper: Stepper,
});

export default SidebarOutput;
