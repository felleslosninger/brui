import cl from 'clsx/lite';
import ChatBubble from './ChatBubble';
import ChatText from './ChatText';
import { Skeleton } from '@digdir/designsystemet-react';
import { Process } from "@navikt/ds-react";
import { TasklistSendIcon } from "@navikt/aksel-icons";
import { Message } from "../../types/message";

interface SidebarOutputProps {
    children?: React.ReactNode;
    className?: string;
    messageHistory: Message[];
    isLoadingResponse: boolean;
}

export default function SidebarOutputRoot({
                                              children,
                                              className,
                                              messageHistory,
                                              isLoadingResponse
                                          }: SidebarOutputProps) {
    return (
        <div className={cl("sidebar-output", className)}>
            {children ? (
                children
            ) : (
                <>
                    {messageHistory.map((msg: Message, index) => (
                        <div key={index}>

                            <div className="chat-row right">
                                <SidebarOutput.ChatText>
                                    {msg.userMessage.text}
                                </SidebarOutput.ChatText>
                            </div>

                            {msg.userMessage.mode === "Info" && (
                                msg.assistantMessages.map((assistantMsg, i) => (
                                    <div className="chat-row" key={i}>
                                        <SidebarOutput.ChatBubble>
                                            {assistantMsg.text}
                                        </SidebarOutput.ChatBubble>
                                    </div>
                                ))
                            )}

                            {msg.userMessage.mode === "Act" && (
                                <Process>

                                    {msg.assistantMessages.map((assistantMsg, i) => (
                                        <Process.Event
                                            key={i}
                                            status="completed"
                                            title={assistantMsg.text}
                                            timestamp={new Date().toLocaleDateString("nb-NO")}
                                            bullet={<TasklistSendIcon />}
                                        />
                                    ))}

                                </Process>
                            )}
                        </div>
                    ))}

                    {isLoadingResponse && (
                        <div className="chat-bubble-skeleton" key="isLoadingResponse">
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
});
