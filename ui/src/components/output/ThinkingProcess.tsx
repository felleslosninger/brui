import { useState, useEffect } from 'react';
import cl from 'clsx/lite';
import {
    HourglassTopFilledIcon,
    CircleIcon,
    CheckmarkCircleIcon,
} from '@navikt/aksel-icons';

interface ThinkingStep {
    label: string;
    status: 'completed' | 'active' | 'pending';
}

interface ThinkingProcessProps {
    children?: React.ReactNode;
    className?: string;
    steps?: string[];
}

const defaultSteps = [
    'Understanding the question',
    'Searching for relevant context',
    'Reasoning through options',
    'Formulating a response',
];

export default function ThinkingProcess({ children, className, steps }: ThinkingProcessProps) {
    const stepLabels = steps ?? defaultSteps;
    const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>(
        stepLabels.map((label, i) => ({
            label,
            status: i === 0 ? 'active' : 'pending',
        }))
    );

    useEffect(() => {
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
    }, [stepLabels.length]);

    return (
        <div className={cl('brui-thinking-process', className)} data-size="sm">
            <ol className="brui-thinking-steps">
                {thinkingSteps.map((step, i) => (
                    <li
                        key={i}
                        className={cl('brui-thinking-step', `brui-thinking-step--${step.status}`)}
                    >
                        <span className="brui-thinking-step-icon">
                            {step.status === 'completed' && <CheckmarkCircleIcon aria-hidden />}
                            {step.status === 'active' && <HourglassTopFilledIcon aria-hidden />}
                            {step.status === 'pending' && <CircleIcon aria-hidden />}
                        </span>
                        <span className="brui-thinking-step-label">{step.label}</span>
                    </li>
                ))}
            </ol>
            {children}
        </div>
    );
}
