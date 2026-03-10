const GATEWAY_URL =
  "https://envoy-ai-gateway-envoy-ai-gateway-system.apps.eid-systest.norwayeast.aroapp.io/";

export interface Tool {
    type: string;
    function: {
        name: string;
        description?: string;
        parameters?: any;
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
    content: string;
}

interface ToolCall {
    function: {
        name: string;
        arguments: string;
    };
}

export async function Chat(content: string, ctx: InferenceContext): Promise<any> {
    const model = ctx.config.inference?.name || 'default-model';
    const tools = ctx.config.decisions?.tools || [];

    try {
        console.log('[Inference] Tool request payload:', JSON.stringify({ 
            model, 
            messages: [{ role: 'user', content }],
            tools: tools.length > 0 ? tools : undefined 
        }, null, 2));

        const requestBody: any = {
            model,
            messages: [{ role: 'user', content }] as ChatMessage[],
        };

        if (tools.length > 0) {
            requestBody.tools = tools;
        }

        const response = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-ai-eg-model": model,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gateway error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        console.log('[Inference] Full response from gateway:', JSON.stringify(data, null, 2));

        const choice = data.choices[0];
        
        if (choice.message.tool_calls) {
            console.log(`[Inference] Tool calls: ${choice.message.tool_calls.length}`);
            return choice.message.tool_calls.map((tc: any) => ({
                function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments
                }
            }));
        }

        return choice.message.content;
    } catch (error) {
        console.error('[Inference] Error:', error instanceof Error ? error.message : error);
        throw error;
    }
}