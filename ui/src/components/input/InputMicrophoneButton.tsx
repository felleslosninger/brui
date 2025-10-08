import { Button } from "@digdir/designsystemet-react";
import cl from "clsx";
interface InputMicrophoneButtonProps {
    className?: string;
}

export default function InputMicrophoneButton({ className }: InputMicrophoneButtonProps) {
    return (
        <Button className={cl('input-field', className)}>
        </Button>
    )
}