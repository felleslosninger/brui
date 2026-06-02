import { useState, useRef } from 'react';
import type { Message, Mode, ProcessStatus } from '../../types/message';
import { Setup } from '../../../../client';
import type {
    Configuration,
    ConversationMessage,
    ContextValue,
    ExecutionMetadata,
    FunctionRegistry,
    ReferenceContextUsage,
} from '../../../../client';
import type { PlannedActionEvent } from '../../../../client/eventHandlers';

function buildConversationHistory(messages: Message[]): ConversationMessage[] {
    return messages.flatMap((message) => {
        const history: ConversationMessage[] = [];
        const userContent = message.userMessage.text.trim();
        const assistantContent = buildAssistantContext(message);

        if (userContent) {
            history.push({
                role: 'user',
                content: userContent,
            });
        }

        if (assistantContent) {
            history.push({
                role: 'assistant',
                content: assistantContent,
            });
        }

        return history;
    });
}

function buildAssistantContext(message: Message): string | null {
    const assistantLines = message.assistantMessages
        .map((assistantMessage) => {
            const text = assistantMessage.text.trim();

            if (!text) {
                return null;
            }

            if (text.startsWith('Waiting for ') || text.startsWith('Running ')) {
                return null;
            }

            if (assistantMessage.action === 'inference' && assistantMessage.status === 'uncompleted') {
                return null;
            }

            if (assistantMessage.action && assistantMessage.action !== 'inference') {
                if (assistantMessage.status === 'completed') {
                    return `Action result: ${text}`;
                }

                if (assistantMessage.status === 'uncompleted') {
                    return `Action error: ${text}`;
                }
            }

            return text;
        })
        .filter((line): line is string => Boolean(line));

    const finalResponse = message.finalResponse?.trim();

    if (finalResponse) {
        assistantLines.push(finalResponse);
    }

    const uniqueAssistantLines = [...new Set(assistantLines)];

    if (uniqueAssistantLines.length === 0) {
        return null;
    }

    return uniqueAssistantLines.join('\n');
}

export interface PendingConfirmation {
    actions: PlannedActionEvent[];
    resolve: (result: PlannedActionEvent[] | false) => void;
}

export function useToolRunner(
    config: Configuration,
    functions: FunctionRegistry,
    context?: ContextValue,
    getPageContext?: () => string | undefined
) {
    const runTools = Setup(config, functions);
    const [messageHistory, setMessageHistory] = useState<Message[]>([]);
    const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
    const autoConfirmRef = useRef(false);

    function updateLastMessage(
        messages: Message[],
        updater: (message: Message) => Message
    ): Message[] {
        if (messages.length === 0) {
            return messages;
        }

        const lastIndex = messages.length - 1;
        const lastMessage = messages[lastIndex];
        const updatedLastMessage = updater(lastMessage);

        if (updatedLastMessage === lastMessage) {
            return messages;
        }

        const copy = [...messages];
        copy[lastIndex] = updatedLastMessage;
        return copy;
    }

    function appendAssistantMessage(
        action: string,
        text: string,
        mode: Mode,
        status: ProcessStatus = 'uncompleted'
    ) {
        setMessageHistory(prev => {
            return updateLastMessage(prev, (lastMessage) => ({
                ...lastMessage,
                assistantMessages: [
                    ...lastMessage.assistantMessages,
                    {
                        id: crypto.randomUUID(),
                        action,
                        status,
                        text,
                        timestamp: Date.now(),
                        messageIndex: lastMessage.userMessage.messageIndex,
                        mode,
                    }
                ]
            }));
        });
    }

    function setFinalResponse(text: string) {
        setMessageHistory(prev => {
            return updateLastMessage(prev, (lastMessage) => ({
                ...lastMessage,
                finalResponse: text,
            }));
        });
    }

    function setReferenceContext(referenceContext: ReferenceContextUsage) {
        setMessageHistory(prev => {
            return updateLastMessage(prev, (lastMessage) => ({
                ...lastMessage,
                referenceContext: {
                    label: referenceContext.label,
                    sources: referenceContext.sources.map((source) => ({
                        title: source.title,
                        ...(source.path ? { path: source.path } : {}),
                        ...(source.lang ? { lang: source.lang } : {}),
                    })),
                },
            }));
        });
    }

    async function askAI(inputText: string, chosenMode: Mode) {
        const pageContextText = getPageContext?.();

        const metadata: ExecutionMetadata = {
            conversationHistory: buildConversationHistory(messageHistory),
            interactionMode: chosenMode,
            context,
            pageContext: pageContextText,
        };

        setMessageHistory(prev => {
            const index = prev.length;
            const newMessage: Message = {
                userMessage: {
                    text: inputText,
                    mode: chosenMode,
                    messageIndex: index,
                    timestamp: Date.now(),
                },
                assistantMessages: []
            };
            return [...prev, newMessage];
        });

        function updateAssistantMessage(id: string, patch: { status: ProcessStatus; text: string }) {
            setMessageHistory(prev => {
                return updateLastMessage(prev, (lastMessage) => ({
                    ...lastMessage,
                    assistantMessages: lastMessage.assistantMessages.map((assistantMessage) =>
                        assistantMessage.id === id
                            ? { ...assistantMessage, ...patch }
                            : assistantMessage
                    )
                }));
            });
        }

        const result = await runTools(inputText, metadata, {
            onThinking: (text) => {
                setMessageHistory(prev => {
                    return updateLastMessage(prev, (lastMessage) => ({
                        ...lastMessage,
                        thinkingText: text,
                    }));
                });
            },

            onContentStream: (text) => {
                setMessageHistory(prev => {
                    return updateLastMessage(prev, (lastMessage) => ({
                        ...lastMessage,
                        streamingContent: text,
                    }));
                });
            },

            onReferenceContextUsed: (referenceContext) => {
                setReferenceContext(referenceContext);
            },

            onToolCallsKnown: (actions) => {
                console.log('Tool calls known:', actions);
                setMessageHistory(prev => {
                    return updateLastMessage(prev, (lastMessage) => {
                        const pending = actions.map((actionEvent) => ({
                            id: actionEvent.id,
                            action: actionEvent.action,
                            status: 'pending',
                            text: `Waiting for ${actionEvent.action}...`,
                            timestamp: Date.now(),
                            messageIndex: lastMessage.userMessage.messageIndex,
                            mode: lastMessage.userMessage.mode
                        }));

                        return {
                            ...lastMessage,
                            assistantMessages: [...lastMessage.assistantMessages, ...pending]
                        };
                    });
                });
            },

            onConfirmActions: (actions) => {
                if (autoConfirmRef.current) {
                    return Promise.resolve(actions);
                }
                return new Promise<PlannedActionEvent[] | false>((resolve) => {
                    setPendingConfirmation({ actions, resolve });
                });
            },

            onActionStart: (actionEvent) => {
                updateAssistantMessage(actionEvent.id, {
                    status: 'active',
                    text: `Running ${actionEvent.action}...`
                });
            },

            onActionComplete: (actionEvent, result) => {
                const text = result.message
                    || (typeof result.result === 'string' ? result.result : undefined)
                    || `${actionEvent.action} completed`;
                updateAssistantMessage(actionEvent.id, {
                    status: 'completed',
                    text,
                });
            },

            onActionError: (actionEvent, error) => {
                updateAssistantMessage(actionEvent.id, {
                    status: 'uncompleted',
                    text: error
                });
            }
        });

        if (!result.success) {
            appendAssistantMessage(
                'inference',
                result.error || 'Inference failed',
                chosenMode
            );
            return;
        }

        if (result.content?.trim()) {
            setFinalResponse(result.content.trim());
        }

        const failedResults = result.executionResults?.filter(
            (executionResult) => !executionResult.success && executionResult.error
        ) || [];

        if (failedResults.length === 0) {
            return;
        }

        setMessageHistory(prev => {
            return updateLastMessage(prev, (lastMessage) => {
                const existingMessageIds = new Set(
                    lastMessage.assistantMessages.map(message => message.id)
                );
                const fallbackMessages = failedResults
                    .filter((executionResult) => !executionResult.id || !existingMessageIds.has(executionResult.id))
                    .map((executionResult) => ({
                        id: executionResult.id || crypto.randomUUID(),
                        action: executionResult.action || 'inference',
                        status: 'uncompleted' as ProcessStatus,
                        text: executionResult.error || 'Action failed',
                        timestamp: Date.now(),
                        messageIndex: lastMessage.userMessage.messageIndex,
                        mode: chosenMode,
                    }));

                if (fallbackMessages.length === 0) {
                    return lastMessage;
                }

                return {
                    ...lastMessage,
                    assistantMessages: [...lastMessage.assistantMessages, ...fallbackMessages]
                };
            });
        });
    }

    function confirmActions(editedActions?: PlannedActionEvent[]) {
        if (pendingConfirmation) {
            pendingConfirmation.resolve(editedActions || pendingConfirmation.actions);
            setPendingConfirmation(null);
        }
    }

    function rejectActions() {
        if (pendingConfirmation) {
            pendingConfirmation.resolve(false);
            setPendingConfirmation(null);
        }
    }

    function setAutoConfirm(value: boolean) {
        autoConfirmRef.current = value;
    }

    return { askAI, messageHistory, pendingConfirmation, confirmActions, rejectActions, setAutoConfirm };
}
