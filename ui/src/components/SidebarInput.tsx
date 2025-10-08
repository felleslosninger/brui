import { Card } from "@digdir/designsystemet-react";
import cl from "clsx";

interface SidebarInputProps {
    children?: React.ReactNode;
    className?: string;
}

export default function SidebarChat({ children, className }: SidebarInputProps) {
    return (
        <Card className={cl('sidebar-root', className)}>
            <div>{children}</div>
        </Card>
    )
}