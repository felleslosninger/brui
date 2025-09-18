import { addAPIClient, generatePrivateKey } from './functions';
import type { Context } from '../../../core/types/context';
import { Setup } from '../../../core/setup';
import { Request } from '../../../core/inference';
import { setupUI } from './ui';

const functions: Record<string, Function> = {
    addAPIClient,
    generatePrivateKey
};

async function start() {
    const context = await Setup('config.json', functions);
    setupListeners(context);
}

function setupListeners(context : Context) {
            const { showReasoning, showEmptyState } = setupUI(context);

        context.eventTarget.addEventListener('core:userInput', async (e: any) => {

            showReasoning();
            
            const inferenceData = await Request(e.detail.message, context);

            for (const toolCall of inferenceData || []) {
                const toolName = toolCall.function.name;
                const args = toolCall.function.arguments;
                const action = context.config.actions[toolName];
                
                if (action) {
                    for (const trigger of action.triggers) {
                        context.container.triggerMap.get(trigger.name)?.(args);
                        context.eventTarget.dispatchEvent(new CustomEvent('event:triggered', { 
                            detail: {
                                type: trigger.type,
                                name: trigger.name,
                                args: args
                            }
                        }));
                    }
                } else {
                    console.warn(`No action found for tool: ${toolName}`);
                }
            }
            
            if (!inferenceData || inferenceData.length === 0) {
                showEmptyState();
            }
    });

    context.eventTarget.addEventListener('site0:genPrivKey', (detail) => {
        generatePrivateKey(detail);
    });
}

start();