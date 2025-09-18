import type { Configuration } from "./configuration";
import type { Tool } from "./tool";

export interface Container {
    triggerMap: Map<string, (...args: any[]) => void>;
    tools: Tool[]
}

export interface Context {
    container: Container;
    config: Configuration;
    eventTarget: EventTarget;
}