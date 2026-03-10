import { Card } from '@digdir/designsystemet-react';
import cl from 'clsx/lite';

interface ChatBubbleProps {
    children?: React.ReactNode;
    className?: string;
}

export default function ChatBubble({ children, className }: ChatBubbleProps) {
    return (
        <div className="brui-chat-bubble-wrapper">
            <Card className={cl('brui-chat-bubble', className)}>
                {children}
            </Card>
        </div>
    )
}