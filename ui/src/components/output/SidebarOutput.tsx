import cl from 'clsx/lite';
import ChatBubble from './ChatBubble';
import ChatText from './ChatText';
import ThinkingProcess from './ThinkingProcess';
import { Skeleton } from '@digdir/designsystemet-react';
import { Process } from '@navikt/ds-react';
import { TasklistSendIcon } from '@navikt/aksel-icons';
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

                            {msg.userMessage.text.toLowerCase().includes('think about it') && (
                                <SidebarOutput.ThinkingProcess />
                            )}

                            {msg.userMessage.mode === 'Info' && (
                                msg.assistantMessages.map((assistantMsg, i) => (
                                    <SidebarOutput.ChatBubble key={i}>
                                        {assistantMsg.text}
                                    </SidebarOutput.ChatBubble>
                                ))
                            )}

                            {msg.userMessage.mode === 'Act' && (
                                <Process>
                                    {msg.assistantMessages.map((assistantMsg, i) => (
                                        <Process.Event
                                            key={i}
                                            status={assistantMsg.status}
                                            title={assistantMsg.text}
                                            timestamp={new Date().toLocaleDateString('nb-NO')}
                                            bullet={<TasklistSendIcon />}
                                        />
                                    ))}
                                </Process>
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
    ThinkingProcess: ThinkingProcess,
});

export default SidebarOutput;
