import { Card } from "@digdir/designsystemet-react";
import { PersonPregnantFillIcon } from "@navikt/aksel-icons";
import cl from 'clsx/lite';
import ChatBubble from "./ChatBubble";
import ChatText from "./ChatText";

interface SidebarChatProps {
    children?: React.ReactNode;
    className?: string;
}

export default function SidebarChat({ children, className }: SidebarChatProps) {
    return (
        <Card className={cl('sidebar-root', className)}>
            <div>
                {children}
                <ChatBubble> heyy </ChatBubble>
                <ChatText> hey </ChatText>
            </div>
        </Card>
    )
}