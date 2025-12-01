import cl from 'clsx/lite';
import InputField from './InputField';
import InputSubmitButton from './InputSubmitButton';
import InputMicrophoneButton from './InputMicrophoneButton';
import InputContextDropdown from './InputContextDropdown';
import { FormEvent } from 'react';
import { Mode } from "../../types/message";

interface SidebarInputProps {
    children?: React.ReactNode;
    className?: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    modes: Mode[];
}

export default function SidebarInputRoot({ children, className, onSubmit, modes }: SidebarInputProps) {
    return (
        <div className={cl('sidebar-input', className)}>
            {children ? (
                children
            ) : (
                <form onSubmit={onSubmit} className="sidebar-input-content">
                    <SidebarInput.ContextMenu modes={modes} />
                    <div className="sidebar-input-row">
                        <SidebarInput.InputField/>
                        <div className="sidebar-input-buttons">
                            <SidebarInput.Microphone/>
                            <SidebarInput.Submit/>
                        </div>
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