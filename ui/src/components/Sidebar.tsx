import SidebarOutput from "./output/SidebarOutput";
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
        <div className={cl('sidebar-content', className)}>
            {children ? (
                children
            ) : (
                <div>
                    <div className="sidebar-output">
                        <Sidebar.Output />
                    </div>

                    <div className="sidebar-input">
                        <Sidebar.Input handleSubmit={handleSubmit} />
                    </div>
                </div>
            )}
        </div>
    );
}

const Sidebar = Object.assign(SidebarRoot, {
    Output: SidebarOutput,
    Input: SidebarInput,
});

export default Sidebar;