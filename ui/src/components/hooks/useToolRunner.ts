import { useState } from 'react';
import { Message, Mode } from '../../types/message';
import { Configuration, FunctionRegistry, Setup } from '../../../../client';
import { ProcessEventProps } from '@navikt/ds-react/Process';

export function useToolRunner(config: Configuration, functions: FunctionRegistry) {
    const runTools = Setup(config, functions);
    const [messageHistory, setMessageHistory] = useState<Message[]>([]);

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
                const m = { ...copy[copy.length - 1] };
                m.assistantMessages = m.assistantMessages.map(am =>
                    am.action === action ? { ...am, ...patch } : am
                );
                copy[copy.length - 1] = m;
                return copy;
            });
        }

        const result = await runTools(inputText, null, {
            onToolCallsKnown: (actions) => {
                console.log('Tool calls known:', actions);
                setMessageHistory(prev => {
                    const copy = [...prev];
                    const m = { ...copy[copy.length - 1] };
                    const pending = actions.map(action => ({
                        id: crypto.randomUUID(),
                        action,
                        status: 'pending' as ProcessEventProps['status'],
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
                updateAssistantMessage(action, { status: 'active', text: `Running ${action}...` });
            },

            onActionComplete: (action, result) => {
                updateAssistantMessage(action, { status: 'completed', text: result.message || result.result || `${action} completed` });
            },

            onActionError: (action, error) => {
                updateAssistantMessage(action, { status: 'uncompleted', text: error });
            }
        });

        // Store the final LLM response
        if (result) {
            const responseText = typeof result === 'string' ? result : result?.message?.content ?? result?.content ?? '';
            if (responseText) {
                setMessageHistory(prev => {
                    const copy = [...prev];
                    const m = { ...copy[copy.length - 1] };
                    m.finalResponse = responseText;
                    copy[copy.length - 1] = m;
                    return copy;
                });
            }
        }
    }

    return { askAI, messageHistory };
}