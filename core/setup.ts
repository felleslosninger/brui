import { Load } from './config';
import type { Configuration } from './types/configuration';
import type { Context, Container } from './types/context';

const container: Container = {
    triggerMap: new Map<string, (...args: any[]) => void>(),
    tools: []
}

export async function Setup(configPath: string, functions: Record<string, Function>): Promise<Context> {
    const config: Configuration = await Load(configPath);

    const eventTarget = new EventTarget();

    const triggerMap = new Map([
        ['function', (triggerName: string) => (...args: any[]) => functions[triggerName]?.(...args)],
        ['event', (triggerName: string) => (...args: any[]) => eventTarget.dispatchEvent(new CustomEvent(triggerName, { detail: args }))]
    ]);

    const tools = Object.values(config.actions).map(action => action.tool);

    Object.values(config.actions).forEach(action => {
        action.triggers.forEach(trigger => {
            const triggerType = triggerMap.get(trigger.type);
            if (triggerType) {
                container.triggerMap.set(trigger.name, triggerType(trigger.name));
            }
        });
    });

    container.tools = tools;

    const context: Context = {
        container,
        config,
        eventTarget
    };

    return context;
}