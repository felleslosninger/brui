import { Card } from "@digdir/designsystemet-react";
import SidebarChat from "./chat/SidebarChat";
import SidebarInput from "./input/SidebarInput";

import "../styling/sidebar.css"

import cl from 'clsx/lite';
import { FormEvent } from "react";

interface SidebarRootProps {
    children?: React.ReactNode;
    className?: string;
    handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function SidebarRoot({ children, className, handleSubmit }: SidebarRootProps) {
    return (
        <div className={cl('sidebar-root', className)}>
            <Card className="sidebar-card">
                {children ? (
                    children
                ) : (
                    <div className="sidebar-content">
                        <Sidebar.Chat />
                        <div className="sidebar-input">
                            <Sidebar.Input handleSubmit={handleSubmit} />
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

const Sidebar = Object.assign(SidebarRoot, {
    Chat: SidebarChat,
    Input: SidebarInput,
});

export default Sidebar;