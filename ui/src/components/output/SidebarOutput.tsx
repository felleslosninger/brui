import cl from 'clsx/lite';
import ChatBubble from './ChatBubble';
import ChatText from './ChatText';
import { Skeleton } from '@digdir/designsystemet-react';
import { Link, Process } from "@navikt/ds-react";
import { BabyWrappedIcon, FileIcon, TasklistSendIcon } from "@navikt/aksel-icons";
import "@navikt/ds-css";

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

                    <Process>
                        <Process.Event
                            status="completed"
                            title="Barnet ble født"
                            timestamp="04. august 2025"
                            bullet={<BabyWrappedIcon />}
                        />
                        <Process.Event
                            status="completed"
                            title="Du søkte om FORELDREPENGER"
                            timestamp="22. august 2025"
                            bullet={<TasklistSendIcon />}
                        >
                            <Link href="/eksempel">
                                <FileIcon aria-hidden fontSize={24} />
                                Søknad om foreldrepenger ved fødsel
                            </Link>
                        </Process.Event>
                    </Process>

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