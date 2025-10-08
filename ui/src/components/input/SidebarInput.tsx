import { Card } from "@digdir/designsystemet-react";
import cl from "clsx";
import InputField from "./InputField";
import SubmitButton from "./SubmitButton";
import InputMicrophoneButton from "./InputMicrophoneButton";
import SidebarChat from "../chat/SidebarChat";

interface SidebarInputProps {
    children?: React.ReactNode;
    className?: string;
}

export default function SidebarInputRoot({ children, className }: SidebarInputProps) {
    return (
        <Card className={cl('sidebar-input-root', className)}>
            {children ? (
                children
            ) : (
                <div className="sidebar-input-content">
                    <InputField />
                    <InputMicrophoneButton />
                    <SubmitButton />
                </div>
            )}
        </Card>
    )
}

const SidebarInput = Object.assign(SidebarInputRoot, {
    InputField: InputField,
    Microphone: InputMicrophoneButton,
    Submit: SubmitButton
});