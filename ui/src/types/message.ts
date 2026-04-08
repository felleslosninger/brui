import type { ProcessEventProps } from "@navikt/ds-react/Process";

export type Mode = 'Info' | 'Act';

export interface Message {
    userMessage: UserMessage;
    assistantMessages: AssistantMessage[];
    finalResponse?: string;
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
    status: ProcessEventProps['status'];
    action: string;
}
