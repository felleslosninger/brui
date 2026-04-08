import { Card } from '@digdir/designsystemet-react';
import Markdown from 'react-markdown';
import cl from 'clsx/lite';

interface ChatBubbleProps {
    children?: React.ReactNode;
    className?: string;
}

export default function ChatBubble({ children, className }: ChatBubbleProps) {
    const content = typeof children === 'string'
        ? <Markdown>{children}</Markdown>
        : children;

    return (
        <div className="brui-chat-bubble-wrapper" data-size={'sm'}>
            <Card className={cl('brui-chat-bubble', className)}>
                {content}
            </Card>
        </div>
    )
}