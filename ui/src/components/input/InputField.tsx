import { Input } from "@digdir/designsystemet-react";
import cl from 'clsx/lite';

interface InputFieldProps {
    className?: string;
}

export default function InputField({ className }: InputFieldProps) {
    return (
        <Input name={"chatMessage"} className={cl('input-field', className)} placeholder="How can I help you" />
    )
}