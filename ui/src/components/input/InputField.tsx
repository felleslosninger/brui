import { Input } from "@digdir/designsystemet-react";
import cl from "clsx";

interface InputFieldProps {
    className?: string;
}

export default function InputField({ className }: InputFieldProps) {
    return (
        <Input name={"chatMessage"} className={cl('sidebar-input-field', className)} placeholder="How can I help you" />
    )
}