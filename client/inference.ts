const GATEWAY_URL = "https://envoy-ai-gateway-envoy-ai-gateway-system.apps.eid-systest.norwayeast.aroapp.io/";

export interface Tool {
    type: string;
    function: {
        name: string;
        description: string;
        parameters: any;
    };
}

export interface InferenceContext {
    config: {
        inference?: {
            name: string;
            provider: string;
        };
        decisions?: {
            tools?: Tool[];
        };
    };
}

interface ChatMessage {
    role: string;
    content?: string;
    tool_calls?: ToolCall[];
}

interface ToolCall {
    id?: string;
    type?: string;
    function?: {
        name: string;
        arguments: string;
    };
}

interface ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];
    tools?: Tool[];
    stream?: boolean;
}

interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
        index: number;
        message: {
            role: string;
            content?: string;
            tool_calls?: ToolCall[];
        };
        finish_reason: string;
    }[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export async function Chat(content: string, ctx: InferenceContext): Promise<any> {
    const model = ctx.config.inference?.name || 'gpt-4o-mini';
    const tools = ctx.config.decisions?.tools || [];

    const requestPayload: ChatCompletionRequest = {
        model: model,
        messages: [
            { role: 'user', content: content }
        ],
        tools: tools.length > 0 ? tools : undefined,
        stream: false,
    };

    try {
        console.log('[Inference] Tool request payload:', JSON.stringify({ model, payload: requestPayload }, null, 2));

        const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-ai-eg-model": model,
            },
            body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gateway error (${response.status}): ${errorText}`);
        }

        const data = await response.json() as ChatCompletionResponse;

        console.log('[Inference] Full response from gateway:', JSON.stringify(data, null, 2));

        if (!data.choices || data.choices.length === 0) {
            throw new Error('No choices returned from gateway');
        }

        const message = data.choices[0].message;

        if (message.tool_calls && message.tool_calls.length > 0) {
            console.log(`[Inference] Tool calls: ${message.tool_calls.length}`);
            return message.tool_calls.map(tc => ({
                function: {
                    name: tc.function?.name,
                    arguments: tc.function?.arguments ? JSON.parse(tc.function.arguments) : {}
                }
            }));
        }

        return message.content || '';
    } catch (error) {
        console.error('[Inference] Error:', error instanceof Error ? error.message : error);
        throw error;
    }
}