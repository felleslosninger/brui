import { Card } from "@digdir/designsystemet-react";
import SidebarChat from "./output/SidebarChat";
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
        </div>
    );
}

const Sidebar = Object.assign(SidebarRoot, {
    Chat: SidebarChat,
    Input: SidebarInput,
});

export default Sidebar;