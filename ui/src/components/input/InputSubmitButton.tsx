import { Button } from "@digdir/designsystemet-react";
import cl from "clsx";
import { MicrophoneIcon, PaperplaneIcon } from "@navikt/aksel-icons";

interface InputSubmitButtonProps {
    className?: string;
}

export default function InputSubmitButton({ className }: InputSubmitButtonProps) {
    return (
        <Button className={cl('input-field', className)} data-size="sm" type={"submit"}>
            <PaperplaneIcon title="send-chat" fontSize="1.5rem" />
        </Button>
    )
}