import { useState, useEffect } from 'react';
import cl from 'clsx/lite';
import {
    HourglassTopFilledIcon,
    CircleIcon,
    CheckmarkCircleIcon,
    ExclamationmarkTriangleFillIcon,
} from '@navikt/aksel-icons';

export interface StepperStep {
    label: string;
    status: 'completed' | 'active' | 'pending' | 'error';
}

interface StepperProps {
    children?: React.ReactNode;
    className?: string;
    steps?: string[];
    controlledSteps?: StepperStep[];
    thinkingText?: string;
}

const defaultSteps = [
    'Understanding the question',
    'Searching for relevant context',
    'Reasoning through options',
    'Formulating a response',
];

export default function Stepper({ children, className, steps, controlledSteps, thinkingText }: StepperProps) {
    const stepLabels = steps ?? defaultSteps;
    const [thinkingSteps, setThinkingSteps] = useState<StepperStep[]>(
        stepLabels.map((label, i) => ({
            label,
            status: i === 0 ? 'active' : 'pending',
        }))
    );

    useEffect(() => {
        // Skip auto-animation when controlled externally
        if (controlledSteps) return;

        let current = 0;

        const interval = setInterval(() => {
            current++;
            if (current >= stepLabels.length) {
                clearInterval(interval);
                setThinkingSteps(prev =>
                    prev.map(s => ({ ...s, status: 'completed' as const }))
                );
                return;
            }

            setThinkingSteps(prev =>
                prev.map((s, i) => ({
                    ...s,
                    status:
                        i < current ? 'completed' :
                            i === current ? 'active' :
                                'pending',
                }))
            );
        }, 1200);

        return () => clearInterval(interval);
    }, [stepLabels.length, controlledSteps]);

    const displaySteps = controlledSteps ?? thinkingSteps;

    return (
        <div className={cl('brui-stepper', className)} data-size="sm">
            <ol className="brui-stepper-steps">
                {displaySteps.map((step, i) => (
                    <li
                        key={i}
                        className={cl('brui-stepper-step', `brui-stepper-step--${step.status}`)}
                    >
                        <span className="brui-stepper-step-icon">
                            {step.status === 'completed' && <CheckmarkCircleIcon aria-hidden />}
                            {step.status === 'active' && <HourglassTopFilledIcon aria-hidden />}
                            {step.status === 'pending' && <CircleIcon aria-hidden />}
                            {step.status === 'error' && <ExclamationmarkTriangleFillIcon aria-hidden />}
                        </span>
                        <span className="brui-stepper-step-label">{step.label}</span>
                    </li>
                ))}
            </ol>
            {thinkingText && (
                <div className="brui-stepper-thinking">
                    <span className="brui-stepper-thinking-text">{thinkingText}</span>
                </div>
            )}
            {children}
        </div>
    );
}
