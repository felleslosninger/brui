import type { Action, Decision, Inference, Option, Resource, Resources } from './types';

type OptionStore = Map<string, Option>;
type ActionStore = Map<string, Action>;
type DecisionStore = Map<string, Decision>;

interface ResourceStore {
    options: OptionStore;
    actions: ActionStore;
    decisions: DecisionStore;
}

export type FunctionRegistry = Record<string, Function>;

export interface StoreInterface {
    get(kind: string, name: string): Resource | undefined;
    getAll(kind: string): Resource[];
    executeAction(actionName: string, args: Record<string, unknown>, decisionMetadata?: Record<string, unknown>): Promise<{ result: string, message?: string }>;
    getDecisionsByOption(optionName: string): Decision[];
    eventTarget: EventTarget;
}

async function loadConfiguration(source: string): Promise<{ options: Option[], actions: Action[], decisions: Decision[], inference?: Inference }> {
    const response = await fetch(source);
    if (!response.ok) {
        throw new Error(`Failed to load config from ${source}: ${response.statusText}`);
    }
    const resources = await response.json() as Resources;
    return groupResourcesByKind(resources);
}

function groupResourcesByKind(resources: Resources): { options: Option[], actions: Action[], decisions: Decision[], inference?: Inference } {
    const grouped = {
        options: [] as Option[],
        actions: [] as Action[],
        decisions: [] as Decision[],
        inference: undefined as Inference | undefined
    };
    
    resources.forEach(resource => {
        categorizeResource(resource, grouped);
    });
    
    return grouped;
}

function categorizeResource(resource: Resource, grouped: { options: Option[], actions: Action[], decisions: Decision[], inference?: Inference }) {
    switch (resource.kind) {
        case 'option':
            grouped.options.push(resource as Option);
            break;
        case 'action':
            grouped.actions.push(resource as Action);
            break;
        case 'decision':
            grouped.decisions.push(resource as Decision);
            break;
        case 'inference':
            grouped.inference = resource as Inference;
            break;
        default:
            console.warn(`Unknown resource kind: ${resource.kind}`);
    }
}

export async function createResourceStore(configSource: string, functions?: FunctionRegistry): Promise<StoreInterface>;
export function createResourceStore(config: { options: Option[], actions: Action[], decisions: Decision[] }, functions?: FunctionRegistry): StoreInterface;

export function createResourceStore(
    configOrSource: { options: Option[], actions: Action[], decisions: Decision[] } | string,
    functions: FunctionRegistry = {}
): Promise<StoreInterface> | StoreInterface {
    if (typeof configOrSource === 'string') {
        return createStoreFromSource(configOrSource, functions);
    } else {
        return createStoreFromConfig(configOrSource, functions);
    }
}

async function createStoreFromSource(source: string, functions: FunctionRegistry): Promise<StoreInterface> {
    const groupedConfig = await loadConfiguration(source);
    return createStoreFromConfig(groupedConfig, functions);
}

function createStoreFromConfig(config: { options: Option[], actions: Action[], decisions: Decision[] }, functions: FunctionRegistry): StoreInterface {
    const data = initializeResourceStore();
    const eventTarget = new EventTarget();
    
    populateResourceMaps(data, config);
    const storeMap = createStoreKindMap(data);
    const lookupMaps = buildLookupMaps(config);
    
    return createStoreInterface(data, storeMap, eventTarget, functions, lookupMaps);
}

function buildLookupMaps(config: { options: Option[], actions: Action[], decisions: Decision[] }) {
    const optionToDecisions = new Map<string, Decision[]>();
    
    config.decisions.forEach(decision => {
        decision.spec.if.forEach(optionName => {
            if (!optionToDecisions.has(optionName)) {
                optionToDecisions.set(optionName, []);
            }
            optionToDecisions.get(optionName)!.push(decision);
        });
    });
    
    return { optionToDecisions };
}

function initializeResourceStore(): ResourceStore {
    return {
        options: new Map(),
        actions: new Map(),
        decisions: new Map()
    };
}

function populateResourceMaps(data: ResourceStore, config: { options: Option[], actions: Action[], decisions: Decision[] }) {
    populateResourceMap(data.options, config.options || []);
    populateResourceMap(data.actions, config.actions || []);
    populateResourceMap(data.decisions, config.decisions || []);
}

function populateResourceMap<T extends Resource>(resourceMap: Map<string, T>, resources: T[]) {
    resources.forEach(resource => {
        resourceMap.set(resource.name, resource);
    });
}

function createStoreKindMap(data: ResourceStore): Map<string, Map<string, Resource>> {
    return new Map<string, Map<string, Resource>>([
        ['option', data.options as Map<string, Resource>],
        ['action', data.actions as Map<string, Resource>],
        ['decision', data.decisions as Map<string, Resource>]
    ]);
}

function createStoreInterface(
    data: ResourceStore, 
    storeMap: Map<string, Map<string, Resource>>, 
    eventTarget: EventTarget, 
    functions: FunctionRegistry,
    lookupMaps: { optionToDecisions: Map<string, Decision[]> }
): StoreInterface {
    return {
        get: (kind: string, name: string) => getResourceFromStore(storeMap, kind, name),
        getAll: (kind: string) => getAllResourcesFromStore(storeMap, kind),
        executeAction: async (actionName: string, args: Record<string, unknown>, decisionMetadata?: Record<string, unknown>) => 
            executeActionHandler(data, eventTarget, functions, actionName, args, decisionMetadata),
        getDecisionsByOption: (optionName: string) => getDecisionsByOptionName(lookupMaps, optionName),
        eventTarget
    };
}

function getDecisionsByOptionName(lookupMaps: { optionToDecisions: Map<string, Decision[]> }, optionName: string): Decision[] {
    return lookupMaps.optionToDecisions.get(optionName) || [];
}

function getResourceFromStore(storeMap: Map<string, Map<string, Resource>>, kind: string, name: string): Resource | undefined {
    const store = storeMap.get(kind);
    return store ? store.get(name) : undefined;
}

function getAllResourcesFromStore(storeMap: Map<string, Map<string, Resource>>, kind: string): Resource[] {
    const store = storeMap.get(kind);
    return store ? Array.from(store.values()) : [];
}

async function executeActionHandler(
    data: ResourceStore,
    eventTarget: EventTarget,
    functions: FunctionRegistry,
    actionName: string, 
    args: Record<string, unknown>, 
    decisionMetadata?: Record<string, unknown>
): Promise<unknown> {
    const action = findAction(data, actionName);
    const combinedMetadata = mergeActionMetadata(action, decisionMetadata);
    
    return executeActionByType(action, eventTarget, functions, actionName, args, combinedMetadata);
}

function findAction(data: ResourceStore, actionName: string): Action {
    const action = data.actions.get(actionName);
    if (!action) {
        throw new Error(`Action not found: ${actionName}`);
    }
    return action;
}

function mergeActionMetadata(action: Action, decisionMetadata?: Record<string, unknown>): Record<string, unknown> {
    return {
        ...action.metadata,
        ...decisionMetadata
    };
}

async function executeActionByType(
    action: Action,
    eventTarget: EventTarget,
    functions: FunctionRegistry,
    actionName: string,
    args: Record<string, unknown>,
    combinedMetadata: Record<string, unknown>
): Promise<unknown> {
    if (action.type === 'function') {
        return executeFunctionAction(functions, action, args);
    } else if (action.type === 'event') {
        return executeEventAction(eventTarget, actionName, args, combinedMetadata, action);
    } else {
        throw new Error(`Unknown action type: ${action.type}`);
    }
}

async function executeFunctionAction(
    functions: FunctionRegistry,
    action: Action,
    args: Record<string, unknown>,
): Promise<unknown> {
    const functionName = action.spec.function_name;
    if (!functionName) {
        throw new Error(`Action ${action.name} has no function_name in spec`);
    }
    
    const fn = functions[functionName as string];
    if (!fn) {
        throw new Error(`Function not registered: ${functionName}`);
    }
    if (Array.isArray(action.spec.args)) {
        const values = action.spec.args.map((key: string) => args[key]);
        return await fn(...values);
    } else {
        return await fn(args);
    }
}

function executeEventAction(
    eventTarget: EventTarget,
    actionName: string,
    args: Record<string, unknown>,
    combinedMetadata: Record<string, unknown>,
    action: Action
): { eventDispatched: string; detail: any } {
    const event = createCustomEvent(actionName, args, combinedMetadata, action);
    eventTarget.dispatchEvent(event);
    
    return { eventDispatched: actionName, detail: event.detail };
}

function createCustomEvent(
    actionName: string,
    args: Record<string, unknown>,
    combinedMetadata: Record<string, unknown>,
    action: Action
): CustomEvent {
    return new CustomEvent(actionName, {
        detail: {
            args,
            metadata: combinedMetadata,
            action
        }
    });
}