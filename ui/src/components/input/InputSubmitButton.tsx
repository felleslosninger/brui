import { Button } from '@digdir/designsystemet-react';
import cl from 'clsx/lite';
import { PaperplaneIcon } from '@navikt/aksel-icons';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useChatContext } from '../ChatContext';

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

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(() =>
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handler = () => setReduced(mq.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return reduced;
}

export default function InputSubmitButton({ children, className }: InputSubmitButtonProps) {
    const { mic } = useChatContext();
    const rms = useSyncExternalStore(mic.subscribeRms, mic.getRms, () => 0);
    const reducedMotion = usePrefersReducedMotion();

    const isProcessing = mic.state === 'processing';
    const isSpeaking = mic.state === 'speaking';
    const animateBars = isSpeaking && !reducedMotion;

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
                                        style={animateBars ? { transform: `scaleY(${rmsBarScale(rms, w)})` } : undefined}
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
