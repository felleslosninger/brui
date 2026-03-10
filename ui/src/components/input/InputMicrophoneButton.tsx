import { Button } from '@digdir/designsystemet-react';
import { MicrophoneIcon } from '@navikt/aksel-icons';
import cl from 'clsx/lite';
interface InputMicrophoneButtonProps {
    className?: string;
}

export default function InputMicrophoneButton({ className }: InputMicrophoneButtonProps) {
    return (
        <Button variant={'tertiary'} className={cl('input-field', className)} data-size="sm">
            <MicrophoneIcon title="microphone-button" className='icon' />
        </Button>
    )
}