import { useState } from "react";
import { Message, Mode } from "../../types/message";
import { Configuration, FunctionRegistry, Setup } from "../../../../client";
import { ProcessEventProps } from "@navikt/ds-react/Process";

type InternalStatus = "pending" | "running" | "success" | "error";

const statusMap: Record<InternalStatus, ProcessEventProps["status"]> = {
    pending: "uncompleted",
    running: "active",
    success: "completed",
    error: undefined
};

export function useToolRunner(config: Configuration, functions: FunctionRegistry) {
    const runTools = Setup(config, functions);
    const [messageHistory, setMessageHistory] = useState<Message[]>([]);

    async function askAI(inputText: string, chosenMode: Mode) {
        const messageId = crypto.randomUUID();

        setMessageHistory(prev => [
            ...prev,
            {
                id: messageId,
                userMessage: {
                    text: inputText,
                    mode: chosenMode,
                    timestamp: Date.now(),
                    messageIndex: prev.length,
                },
                assistantMessages: []
            }
        ]);

        function updateAssistantMessage(
            action: string,
            patch: { status: ProcessEventProps["status"]; text: string }
        ) {
            setMessageHistory(prev =>
                prev.map(msg => {
                    if (msg.id !== messageId) return msg;

                    return {
                        ...msg,
                        assistantMessages: msg.assistantMessages.map(am =>
                            am.action === action ? { ...am, ...patch } : am
                        )
                    };
                })
            );
        }

        await runTools(inputText, null, {
            onToolCallsKnown: (actions) => {
                setMessageHistory(prev =>
                    prev.map(msg => {
                        if (msg.id !== messageId) return msg;

                        const pending = actions.map(action => ({
                            id: crypto.randomUUID(),
                            action,
                            status: statusMap.pending,
                            text: `Waiting for ${action}...`,
                            timestamp: Date.now(),
                            messageIndex: msg.userMessage.messageIndex,
                            mode: msg.userMessage.mode
                        }));

                        return {
                            ...msg,
                            assistantMessages: [
                                ...msg.assistantMessages,
                                ...pending
                            ]
                        };
                    })
                );
            },

            onActionStart: (action) => {
                updateAssistantMessage(action, {
                    status: statusMap.running,
                    text: `Running ${action}...`
                });
            },

            onActionComplete: (action, result) => {
                updateAssistantMessage(action, {
                    status: statusMap.success,
                    text: result.message || result.result || `${action} completed`
                });
            },

            onActionError: (action, error) => {
                updateAssistantMessage(action, {
                    status: statusMap.error,
                    text: String(error)
                });
            }
        });
    }

    return { askAI, messageHistory };
}