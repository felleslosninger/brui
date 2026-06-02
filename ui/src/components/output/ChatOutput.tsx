import { useEffect, useRef } from 'react';
import cl from 'clsx/lite';
import ChatBubble from './ChatBubble';
import ChatText from './ChatText';
import Stepper from './Stepper';
import ConfirmActionCard from './ConfirmActionCard';
import { useChatContext } from '../ChatContext';
import { Message } from '../../types/message';

export interface ChatOutputProps {
    children?: React.ReactNode;
    className?: string;
}

const autoScrollThreshold = 48;

function ChatOutputRoot({
    children,
    className,
}: ChatOutputProps) {
    const { messageHistory, isLoadingResponse, showThinking, pendingConfirmation, confirmActions, rejectActions } = useChatContext();
    const lastMessageIndex = messageHistory.length - 1;
    const outputRef = useRef<HTMLDivElement | null>(null);
    const shouldStickToBottomRef = useRef(true);
    const programmaticScrollRef = useRef(false);

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

        programmaticScrollRef.current = true;
        output.scrollTop = output.scrollHeight;
    }, [messageHistory, isLoadingResponse]);

    function handleScroll() {
        const output = outputRef.current;
        if (!output) {
            return;
        }

        if (programmaticScrollRef.current) {
            programmaticScrollRef.current = false;
            return;
        }

        shouldStickToBottomRef.current = isNearBottom(output);
    }

    return (
        <div
            ref={outputRef}
            className={cl('brui-chat-output', className)}
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
                                        <ChatOutput.ChatText>
                                            {msg.userMessage.text}
                                        </ChatOutput.ChatText>

                                        {loadingSteps.length > 0 && (
                                            <ChatOutput.Stepper
                                                controlledSteps={loadingSteps}
                                                thinkingText={isLatestLoadingMessage && showThinking ? msg.thinkingText : undefined}
                                            />
                                        )}

                                        {isLatestLoadingMessage && pendingConfirmation && (
                                            <ConfirmActionCard
                                                actions={pendingConfirmation.actions}
                                                onConfirm={confirmActions}
                                                onCancel={rejectActions}
                                            />
                                        )}

                                        {!isLatestLoadingMessage && showThinking && msg.thinkingText && (
                                            <div className="brui-stepper-thinking">
                                                <span className="brui-stepper-thinking-text">{msg.thinkingText}</span>
                                            </div>
                                        )}

                                        {chatMessages.map((assistantMsg, i) => (
                                            <ChatOutput.ChatBubble key={`chat-${i}`}>
                                                {assistantMsg.text}
                                            </ChatOutput.ChatBubble>
                                        ))}

                                        {isLatestLoadingMessage && msg.streamingContent && !msg.finalResponse && (
                                            <ChatOutput.ChatBubble>
                                                {msg.streamingContent}
                                            </ChatOutput.ChatBubble>
                                        )}

                                        {msg.finalResponse && (
                                            <ChatOutput.ChatBubble>
                                                {msg.finalResponse}
                                            </ChatOutput.ChatBubble>
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

const ChatOutput = Object.assign(ChatOutputRoot, {
    ChatText: ChatText,
    ChatBubble: ChatBubble,
    Stepper: Stepper,
});

export default ChatOutput;
