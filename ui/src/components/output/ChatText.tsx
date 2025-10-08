import { Card } from "@digdir/designsystemet-react";
import cl from 'clsx/lite';

interface ChatTextProps {
    children?: React.ReactNode;
    className?: string;
}

export default function ChatText({ children, className }: ChatTextProps) {
    return (
        <Card className={cl('chat-text', className)}>
            {children}
        </Card>
    )
}