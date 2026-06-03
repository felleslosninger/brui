import { Button } from '@digdir/designsystemet-react';
import { MicrophoneIcon, StopIcon } from '@navikt/aksel-icons';
import cl from 'clsx/lite';
import { useChatContext } from '../ChatContext';

interface InputMicrophoneButtonProps {
    children?: React.ReactNode;
    className?: string;
}

export default function InputMicrophoneButton({ children, className }: InputMicrophoneButtonProps) {
    const { mic } = useChatContext();

    if (!mic.available) return null;

    const label = mic.recording ? 'Stop recording' : 'Start recording';

    const icon = mic.recording
        ? <StopIcon title="stop" className="brui-icon" />
        : <MicrophoneIcon title="microphone" className="brui-icon" />;

    return (
        <Button
            type="button"
            variant="secondary"
            className={cl(
                'brui-input-button',
                'brui-mic-button',
                mic.recording && 'brui-mic-button--recording',
                className,
            )}
            data-size="sm"
            onClick={() => void mic.toggle()}
            aria-label={label}
            aria-pressed={mic.recording}
            title={label}
        >
            {children ?? icon}
        </Button>
    );
}
