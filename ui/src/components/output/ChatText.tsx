import cl from 'clsx/lite';

interface ChatTextProps {
    children?: React.ReactNode;
    className?: string;
}

export default function ChatText({ children, className }: ChatTextProps) {
    return (
        <div className="brui-chat-text-wrapper">
            <div className={cl('brui-chat-text', className)}>
                {children}
            </div>
        </div>
    );
}