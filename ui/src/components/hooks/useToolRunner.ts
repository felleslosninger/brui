import { useState } from "react";
import type { ProcessEventProps } from "@navikt/ds-react/Process";
import type { Message, Mode } from "../../types/message";
import { Setup } from "../../../../client";
import type { Configuration, FunctionRegistry } from "../../../../client";

export function useToolRunner(config: Configuration, functions: FunctionRegistry) {
    const runTools = Setup(config, functions);
    const [messageHistory, setMessageHistory] = useState<Message[]>([]);

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
        status: ProcessEventProps['status'] = "uncompleted"
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

    async function askAI(inputText: string, chosenMode: Mode) {
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

        function updateAssistantMessage(action: string, patch: { status: ProcessEventProps['status']; text: string }) {
            setMessageHistory(prev => {
                return updateLastMessage(prev, (lastMessage) => ({
                    ...lastMessage,
                    assistantMessages: lastMessage.assistantMessages.map((assistantMessage) =>
                        assistantMessage.action === action
                            ? { ...assistantMessage, ...patch }
                            : assistantMessage
                    )
                }));
            });
        }

        const result = await runTools(inputText, null, {
            onToolCallsKnown: (actions) => {
                console.log("Tool calls known:", actions);
                setMessageHistory(prev => {
                    return updateLastMessage(prev, (lastMessage) => {
                        const pending = actions.map(action => ({
                            id: crypto.randomUUID(),
                            action,
                            status: "pending" as ProcessEventProps['status'],
                            text: `Waiting for ${action}...`,
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

            onActionStart: (action) => {
                updateAssistantMessage(action, { status: "active", text: `Running ${action}...` });
            },

            onActionComplete: (action, result) => {
                updateAssistantMessage(action, { status: "completed", text: result.message || result.result || `${action} completed` });
            },

            onActionError: (action, error) => {
                updateAssistantMessage(action, { status: "uncompleted", text: error });
            }
        });

        if (!result.success) {
            appendAssistantMessage(
                "inference",
                result.error || "Inference failed",
                chosenMode
            );
            return;
        }

        const failedResults = result.executionResults?.filter(
            (executionResult) => !executionResult.success && executionResult.error
        ) || [];

        if (failedResults.length === 0) {
            return;
        }

        setMessageHistory(prev => {
            return updateLastMessage(prev, (lastMessage) => {
                const existingActions = new Set(
                    lastMessage.assistantMessages.map(message => message.action)
                );
                const fallbackMessages = failedResults
                    .filter((executionResult) => !executionResult.action || !existingActions.has(executionResult.action))
                    .map((executionResult) => ({
                        id: crypto.randomUUID(),
                        action: executionResult.action || "inference",
                        status: "uncompleted" as ProcessEventProps['status'],
                        text: executionResult.error || "Action failed",
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

    return { askAI, messageHistory };
}
