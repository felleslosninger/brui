import type { ChatRequest, ChatResponse, Tool } from 'ollama';
import type { InferenceContext } from '../inference';

const proxyHost = 'http://localhost:8091';

export async function Request(content: string, ctx: InferenceContext): Promise<any> {
    const tools: Tool[] = ctx.config.decisions?.tools || [];

    const target = ctx.config.inference?.name || 'local-nano';

    const requestPayload: ChatRequest = {
        model: "",
        messages: [
            { role: 'user', content: content }
        ],
        tools: tools.length > 0 ? tools : undefined,
        stream: false,
    };

    try {
        // Print the full tool request
        console.log('[Inference] Tool request payload:', JSON.stringify({ target, payload: requestPayload }, null, 2));

        const response = await fetch(`${proxyHost}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: target,
                payload: requestPayload
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Proxy error (${response.status}): ${errorText}`);
        }

        const chat = await response.json() as ChatResponse;

        // Print the full response from ollama
        console.log('[Inference] Full response from ollama:', JSON.stringify(chat, null, 2));

        if (chat.message.tool_calls) {
            console.log(`[Inference] Tool calls: ${chat.message.tool_calls.length}`);
        }

        return chat.message.tool_calls?.length
            ? chat.message.tool_calls
            : chat.message.content;
    } catch (error) {
        console.error('[Inference] Error:', error instanceof Error ? error.message : error);
        throw error;
    }
}