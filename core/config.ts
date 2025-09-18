import type { Configuration } from './types/index';

export async function Load(configPath: string): Promise<Configuration> {
    const response = await fetch(configPath);
    if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
    }
    const config: Configuration = await response.json();
    return config;
}
