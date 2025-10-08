import { Button } from "@digdir/designsystemet-react";
import cl from "clsx";
import { MicrophoneIcon } from "@navikt/aksel-icons";

interface SubmitButtonProps {
    className?: string;
}

export default function SubmitButton({ className }: SubmitButtonProps) {
    return (
        <Button className={cl('input-field', className)}>
        </Button>
    )
}