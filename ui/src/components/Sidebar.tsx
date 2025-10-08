import { Card } from "@digdir/designsystemet-react";
import SidebarChat from "./SidebarChat";
import SidebarInput from "./SidebarInput";

import "../styling/sidebar.css"

import cl from 'clsx/lite';

interface SidebarRootProps {
    children?: React.ReactNode;
    className?: string;
}

function SidebarRoot({ children, className }: SidebarRootProps) {
    return (
        <div className={cl('sidebar-root', className)}>
            <Card className="sidebar-card">
                {children ? (
                    children
                ) : (
                    <div className="sidebar-content">
                        <SidebarChat />
                        <div className="sidebar-input">
                            <SidebarInput />
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