import { useState } from "react";
import type { ProcessEventProps } from "@navikt/ds-react/Process";
import type { Message, Mode } from "../../types/message";
import { Setup } from "../../../../client";
import type { Configuration, FunctionRegistry } from "../../../../client";

export function useToolRunner(config: Configuration, functions: FunctionRegistry) {
    const runTools = Setup(config, functions);
    const [messageHistory, setMessageHistory] = useState<Message[]>([]);

    function appendAssistantMessage(
        action: string,
        text: string,
        mode: Mode,
        status: ProcessEventProps['status'] = "uncompleted"
    ) {
        setMessageHistory(prev => {
            const copy = [...prev];
            const m = copy[copy.length - 1];
            m.assistantMessages = [
                ...m.assistantMessages,
                {
                    id: crypto.randomUUID(),
                    action,
                    status,
                    text,
                    timestamp: Date.now(),
                    messageIndex: m.userMessage.messageIndex,
                    mode,
                }
            ];
            copy[copy.length - 1] = m;
            return copy;
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
                const copy = [...prev];
                const m = copy[copy.length - 1];
                m.assistantMessages = m.assistantMessages.map(am =>
                    am.action === action ? { ...am, ...patch } : am
                );
                copy[copy.length - 1] = m;
                return copy;
            });
        }

        const result = await runTools(inputText, null, {
            onToolCallsKnown: (actions) => {
                console.log("Tool calls known:", actions);
                setMessageHistory(prev => {
                    const copy = [...prev];
                    const m = copy[copy.length - 1];
                    const pending = actions.map(action => ({
                        id: crypto.randomUUID(),
                        action,
                        status: "pending" as ProcessEventProps['status'],
                        text: `Waiting for ${action}...`,
                        timestamp: Date.now(),
                        messageIndex: m.userMessage.messageIndex,
                        mode: m.userMessage.mode
                    }));
                    m.assistantMessages = [...m.assistantMessages, ...pending];
                    copy[copy.length - 1] = m;
                    return copy;
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
            const copy = [...prev];
            const m = copy[copy.length - 1];
            const existingActions = new Set(m.assistantMessages.map(message => message.action));
            const fallbackMessages = failedResults
                .filter((executionResult) => !executionResult.action || !existingActions.has(executionResult.action))
                .map((executionResult) => ({
                    id: crypto.randomUUID(),
                    action: executionResult.action || "inference",
                    status: "uncompleted" as ProcessEventProps['status'],
                    text: executionResult.error || "Action failed",
                    timestamp: Date.now(),
                    messageIndex: m.userMessage.messageIndex,
                    mode: chosenMode,
                }));

            if (fallbackMessages.length === 0) {
                return prev;
            }

            m.assistantMessages = [...m.assistantMessages, ...fallbackMessages];
            copy[copy.length - 1] = m;
            return copy;
        });
    }

    return { askAI, messageHistory };
}
