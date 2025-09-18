import type { ChatRequest, ChatResponse } from 'ollama';
import type { Context } from './types/context';

const proxyHost = 'http://localhost:8080';

export async function Request(content: string, ctx: Context): Promise<any> {
    let requestPayload: ChatRequest = {
        model: "",
        messages: [
            { role: 'user', content: content  }
        ],
        tools: ctx.container.tools,
        stream: false,
    };

    let response = await fetch(`${proxyHost}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            target: "local-nano",
            payload: requestPayload
        })
    });

    let chat = await response.json() as ChatResponse;

    return chat.message.tool_calls
}
