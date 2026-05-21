import { Button } from '@digdir/designsystemet-react';
import cl from 'clsx/lite';
import { PaperplaneIcon } from '@navikt/aksel-icons';
import { useSyncExternalStore } from 'react';
import { useSidebarContext } from '../SidebarContext';

interface InputSubmitButtonProps {
    children?: React.ReactNode;
    className?: string;
}

const BAR_WEIGHTS = [0.55, 0.85, 1.0, 0.85, 0.55] as const;
const RMS_AMPLIFY = 10;
const RMS_MAX_SCALE = 1.1;

function rmsBarScale(rms: number, weight: number): number {
    return Math.min(RMS_MAX_SCALE, 0.2 + rms * RMS_AMPLIFY * weight);
}

export default function InputSubmitButton({ children, className }: InputSubmitButtonProps) {
    const { mic } = useSidebarContext();
    const rms = useSyncExternalStore(mic.subscribeRms, mic.getRms, () => 0);

    const isProcessing = mic.state === 'processing';
    const isSpeaking = mic.state === 'speaking';

    return (
        <Button
            variant="secondary"
            className={cl('brui-input-button', 'brui-submit-button', mic.recording && 'brui-submit-button--listening', className)}
            data-size="sm"
            type="submit"
            aria-label={mic.recording ? 'Send (voice active)' : undefined}
        >
            {children ?? (
                <>
                    {/* Always rendered — determines button size */}
                    <span className={cl('brui-submit-label', mic.recording && 'brui-submit-label--hidden')} aria-hidden={mic.recording ? 'true' : undefined}>
                        <PaperplaneIcon title="send-chat" className="brui-icon" />
                        Send
                    </span>

                    {/* Absolutely overlaid when recording — size has no effect on layout */}
                    {mic.recording && (
                        <span
                            className={cl(
                                'brui-submit-visualizer',
                                isProcessing && 'brui-submit-visualizer--processing',
                                isSpeaking && 'brui-submit-visualizer--speaking',
                            )}
                            aria-hidden="true"
                        >
                            {isProcessing ? (
                                <>
                                    <span className="brui-voice-dot" />
                                    <span className="brui-voice-dot" />
                                    <span className="brui-voice-dot" />
                                </>
                            ) : (
                                BAR_WEIGHTS.map((w, i) => (
                                    <span
                                        key={i}
                                        className="brui-voice-bar"
                                        style={isSpeaking ? { transform: `scaleY(${rmsBarScale(rms, w)})` } : undefined}
                                    />
                                ))
                            )}
                        </span>
                    )}
                </>
            )}
        </Button>
    );
}
