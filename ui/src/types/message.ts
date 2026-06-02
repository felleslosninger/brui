export type ProcessStatus = 'active' | 'completed' | 'uncompleted';

export type Mode = 'Info' | 'Act';

export interface Message {
    userMessage: UserMessage;
    assistantMessages: AssistantMessage[];
    finalResponse?: string;
    thinkingText?: string;
    streamingContent?: string;
    referenceContext?: ReferenceContextUsage;
}

interface UserMessage {
    messageIndex: number;
    timestamp: number;
    text: string;
    mode: Mode;
}

interface AssistantMessage {
    id: string;
    messageIndex: number;
    timestamp: number;
    text: string;
    mode: Mode;
    status: ProcessStatus;
    action: string;
}

interface ReferenceSource {
    title: string;
    path?: string;
    lang?: string;
}

interface ReferenceContextUsage {
    label: string;
    sources: ReferenceSource[];
}
