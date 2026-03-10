import { ProcessEventProps } from "@navikt/ds-react/Process";

export type Mode = 'Info' | 'Act';

export interface Message {
    id: string;
    userMessage: UserMessage;
    assistantMessages: AssistantMessage[];
}

interface UserMessage {
    messageIndex: number;
    timestamp: number;
    text: string;
    mode: Mode;
}

interface AssistantMessage {
    messageIndex: number;
    timestamp: number;
    text: string;
    mode: Mode;
    status: ProcessEventProps['status'];
    action: string;
}