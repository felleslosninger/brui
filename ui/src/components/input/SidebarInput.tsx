import { Card } from "@digdir/designsystemet-react";
import cl from "clsx";
import InputField from "./InputField";
import InputSubmitButton from "./InputSubmitButton";
import InputMicrophoneButton from "./InputMicrophoneButton";
import InputContextDropdown from "./InputContextDropdown";
import { FormEvent } from "react";

interface SidebarInputProps {
    children?: React.ReactNode;
    className?: string;
    handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function SidebarInputRoot({ children, className, handleSubmit }: SidebarInputProps) {
    return (
        <Card className={cl('sidebar-input-root', className)}>
            {children ? (
                children
            ) : (
                <form className="sidebar-input-content" onSubmit={handleSubmit}>
                    <SidebarInput.ContextMenu/>
                    <div className="sidebar-input-row">
                        <SidebarInput.InputField/>
                        <SidebarInput.Microphone/>
                        <SidebarInput.Submit/>
                    </div>
                </form>
            )}
        </Card>
    )
}

const SidebarInput = Object.assign(SidebarInputRoot, {
    ContextMenu: InputContextDropdown,
    InputField: InputField,
    Microphone: InputMicrophoneButton,
    Submit: InputSubmitButton
});