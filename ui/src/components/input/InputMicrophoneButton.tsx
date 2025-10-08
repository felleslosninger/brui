import { Button } from "@digdir/designsystemet-react";
import cl from "clsx";
import { MicrophoneIcon } from "@navikt/aksel-icons";

interface InputMicrophoneButtonProps {
    className?: string;
}

export default function InputMicrophoneButton({ className }: InputMicrophoneButtonProps) {
    return (
        <Button className={cl('input-field', className)}>
        </Button>
    )
}