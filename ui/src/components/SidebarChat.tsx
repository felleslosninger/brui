import { Card } from "@digdir/designsystemet-react";
import cl from 'clsx/lite';

interface SidebarChatProps {
    children?: React.ReactNode;
    className?: string;
}

export default function SidebarChat({ children, className }: SidebarChatProps) {
    return (
        <Card className={cl('sidebar-root', className)}>
            <div>{children}</div>
        </Card>
    )
}