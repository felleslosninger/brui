export type Mode = 'Info' | 'Act';

export interface Message {
    userMessage: UserMessage;
    assistantMessages: AssistantMessage[];
}

interface UserMessage {
    messageIndex: string;
    timeToComplete: number;
    text: string;
    mode: Mode;
}

interface AssistantMessage {
    messageIndex: string;
    timeToComplete: number;
    text: string;
}