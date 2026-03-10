import { Button } from '@digdir/designsystemet-react';
import { MicrophoneIcon } from '@navikt/aksel-icons';
import cl from 'clsx/lite';

interface InputMicrophoneButtonProps {
    children?: React.ReactNode;
    className?: string;
}

export default function InputMicrophoneButton({ children, className }: InputMicrophoneButtonProps) {
    return (
        <Button variant={'tertiary'} className={cl('brui-input-button', className)} data-size="sm">
            {children ?? <MicrophoneIcon title="microphone-button" className='brui-icon' />}
        </Button>
    );
}