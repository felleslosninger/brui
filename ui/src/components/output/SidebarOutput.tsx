import { useEffect, useRef } from 'react';
import cl from 'clsx/lite';
import ChatBubble from './ChatBubble';
import ChatText from './ChatText';
import Stepper from './Stepper';
import { useSidebarContext } from '../SidebarContext';
import { Message } from '../../types/message';

interface SidebarOutputProps {
    children?: React.ReactNode;
    className?: string;
}

const autoScrollThreshold = 48;

function SidebarOutputRoot({
    children,
    className,
}: SidebarOutputProps) {
    const { messageHistory, isLoadingResponse, showThinking } = useSidebarContext();
    const lastMessageIndex = messageHistory.length - 1;
    const outputRef = useRef<HTMLDivElement | null>(null);
    const shouldStickToBottomRef = useRef(true);

    function areActionStepsFinished(actionSteps: Message['assistantMessages']) {
        return actionSteps.every((actionStep) =>
            actionStep.status === 'completed' || actionStep.status === 'uncompleted'
        );
    }

    function mapActionStatus(status: Message['assistantMessages'][number]['status']) {
        if (status === 'completed') {
            return 'completed' as const;
        }

        if (status === 'active') {
            return 'active' as const;
        }

        if (status === 'uncompleted') {
            return 'error' as const;
        }

        return 'pending' as const;
    }

    useEffect(() => {
        const output = outputRef.current;
        if (!output || !shouldStickToBottomRef.current) {
            return;
        }

        output.scrollTop = output.scrollHeight;
    }, [messageHistory, isLoadingResponse]);

    function handleScroll() {
        const output = outputRef.current;
        if (!output) {
            return;
        }

        shouldStickToBottomRef.current = isNearBottom(output);
    }

    return (
        <div
            ref={outputRef}
            className={cl('brui-sidebar-output', className)}
            onScroll={handleScroll}
        >
            {children ?? (
                <>
                    {messageHistory.map((msg: Message, index) => (
                        <div key={index}>
                            {(() => {
                                const referenceSteps = msg.referenceContext
                                    ? [{
                                        label: msg.referenceContext.label,
                                        status: 'completed' as const,
                                    }]
                                    : [];
                                const actionSteps = msg.assistantMessages.filter(
                                    am => am.action && am.action !== 'inference'
                                );
                                const chatMessages = msg.assistantMessages.filter(
                                    am => !am.action || am.action === 'inference'
                                );
                                const isLatestLoadingMessage = isLoadingResponse && index === lastMessageIndex;
                                const hasStreamStarted = Boolean(msg.streamingContent || msg.thinkingText);
                                const isWaitingForSummary = isLatestLoadingMessage
                                    && actionSteps.length > 0
                                    && areActionStepsFinished(actionSteps)
                                    && !msg.finalResponse;
                                const loadingSteps = isLatestLoadingMessage
                                    ? actionSteps.length === 0
                                        ? hasStreamStarted
                                            ? referenceSteps
                                            : [
                                                ...referenceSteps,
                                                {
                                                    label: 'Waiting for model response',
                                                    status: 'active' as const,
                                                },
                                            ]
                                        : [
                                            {
                                                label: 'Analyzing request',
                                                status: 'completed' as const,
                                            },
                                            ...referenceSteps,
                                            ...actionSteps.map((assistantMessage) => ({
                                                label: assistantMessage.text,
                                                status: mapActionStatus(assistantMessage.status),
                                            })),
                                            ...(isWaitingForSummary ? [{
                                                label: 'Preparing response',
                                                status: 'active' as const,
                                            }] : []),
                                        ]
                                    : actionSteps.length > 0 || referenceSteps.length > 0
                                        ? [
                                            ...referenceSteps,
                                            ...actionSteps.map((assistantMessage) => ({
                                            label: assistantMessage.text,
                                            status: mapActionStatus(assistantMessage.status),
                                            })),
                                        ]
                                        : [];

                                return (
                                    <>
                                        <SidebarOutput.ChatText>
                                            {msg.userMessage.text}
                                        </SidebarOutput.ChatText>

                                        {loadingSteps.length > 0 && (
                                            <SidebarOutput.Stepper
                                                controlledSteps={loadingSteps}
                                                thinkingText={isLatestLoadingMessage ? msg.thinkingText : undefined}
                                            />
                                        )}

                                        {!isLatestLoadingMessage && showThinking && msg.thinkingText && (
                                            <div className="brui-stepper-thinking">
                                                <span className="brui-stepper-thinking-text">{msg.thinkingText}</span>
                                            </div>
                                        )}

                                        {chatMessages.map((assistantMsg, i) => (
                                            <SidebarOutput.ChatBubble key={`chat-${i}`}>
                                                {assistantMsg.text}
                                            </SidebarOutput.ChatBubble>
                                        ))}

                                        {isLatestLoadingMessage && msg.streamingContent && !msg.finalResponse && (
                                            <SidebarOutput.ChatBubble>
                                                {msg.streamingContent}
                                            </SidebarOutput.ChatBubble>
                                        )}

                                        {msg.finalResponse && (
                                            <SidebarOutput.ChatBubble>
                                                {msg.finalResponse}
                                            </SidebarOutput.ChatBubble>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}

function isNearBottom(element: HTMLDivElement): boolean {
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    return distanceFromBottom <= autoScrollThreshold;
}

const SidebarOutput = Object.assign(SidebarOutputRoot, {
    ChatText: ChatText,
    ChatBubble: ChatBubble,
    Stepper: Stepper,
});

export default SidebarOutput;
