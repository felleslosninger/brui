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
        <div className={cl('sidebar-input', className)}>
            {children ? (
                children
            ) : (
                <form onSubmit={handleSubmit}>
                    <SidebarInput.ContextMenu/>
                    <div className="sidebar-input-row">
                        <SidebarInput.InputField/>
                        <SidebarInput.Microphone/>
                        <SidebarInput.Submit/>
                    </div>
                </form>
            )}
        </div>
    )
}

const SidebarInput = Object.assign(SidebarInputRoot, {
    ContextMenu: InputContextDropdown,
    InputField: InputField,
    Microphone: InputMicrophoneButton,
    Submit: InputSubmitButton
});