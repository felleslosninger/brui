import type { Configuration } from '@brui/client';
import type { FunctionRegistry } from '@brui/client';

export const MIN_SIDEBAR_WIDTH = 280;
export const MAX_SIDEBAR_WIDTH = 700;
export type ColorMode = 'light' | 'dark';
export type Language = 'nb' | 'en';

export interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export function clampSidebarWidth(width: number): number {
  return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, width));
}

export function createPlaygroundConfig(): Configuration {
  return {
    tools: [
      {
        type: 'function',
        function: {
          name: 'fillContactForm',
          description:
            'Fill in the contact form with the provided information. Use this when the user wants to fill out the contact form.',
          parameters: {
            type: 'object',
            properties: {
              fullName: { type: 'string', description: 'Full name of the person' },
              emailAddress: { type: 'string', description: 'Email address' },
              phoneNumber: { type: 'string', description: 'Phone number' },
              subject: {
                type: 'string',
                description: 'Subject of the inquiry',
                enum: ['General', 'Support', 'Sales', 'Feedback'],
              },
              messageBody: { type: 'string', description: 'The message body' },
            },
            required: ['fullName', 'emailAddress'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'clearForm',
          description: 'Clear / reset the contact form.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'submitForm',
          description:
            'Submit the contact form. Only call this when the user explicitly asks to submit.',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'incrementCounter',
          description:
            'Increment a counter by a given amount. Use this when the user asks to increase, add to, or bump the counter.',
          parameters: {
            type: 'object',
            properties: {
              amount: {
                type: 'number',
                description: 'Amount to increment by (default 1)',
              },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'switchTab',
          description:
            'Switch the active page/tab in the demo site. Available tabs are: home, contact, about.',
          parameters: {
            type: 'object',
            properties: {
              tab: {
                type: 'string',
                description: 'Tab to switch to',
                enum: ['home', 'contact', 'about'],
              },
            },
            required: ['tab'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'setSidebarWidth',
          description:
            'Set the sidebar width in pixels. Use this when the user asks to resize, widen, narrow, or set the sidebar width.',
          parameters: {
            type: 'object',
            properties: {
              width: {
                type: 'number',
                description: `Sidebar width in pixels. Valid range is ${MIN_SIDEBAR_WIDTH}-${MAX_SIDEBAR_WIDTH}.`,
              },
            },
            required: ['width'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'setColorMode',
          description:
            'Set the page color mode. Use dark when the user wants a darker, dimmer, or night-friendly interface, and light when they want a brighter interface.',
          parameters: {
            type: 'object',
            properties: {
              mode: {
                type: 'string',
                description: 'Color mode to apply.',
                enum: ['light', 'dark'],
              },
            },
            required: ['mode'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'setLanguage',
          description:
            'Set the page language. Use nb for Norwegian and en for English.',
          parameters: {
            type: 'object',
            properties: {
              language: {
                type: 'string',
                description: 'Language code to apply.',
                enum: ['nb', 'en'],
              },
            },
            required: ['language'],
          },
        },
      },
    ],
    actions: [
      {
        name: 'fillFields',
        type: 'function',
        args: ['fullName', 'emailAddress', 'phoneNumber', 'subject', 'messageBody'],
        message:
          'Filled contact form — name: {fullName}, email: {emailAddress}',
      },
      {
        name: 'clearFields',
        type: 'function',
        args: [],
        message: 'Contact form cleared.',
      },
      {
        name: 'submitContactForm',
        type: 'function',
        args: [],
        message: 'Contact form submitted!',
      },
      {
        name: 'handleSwitchTab',
        type: 'function',
        args: ['tab'],
        message: 'Switched to {tab} tab.',
      },
      {
        name: 'handleIncrement',
        type: 'function',
        args: ['amount'],
        message: 'Counter incremented by {amount}.',
      },
      {
        name: 'handleSetSidebarWidth',
        type: 'function',
        args: ['width'],
        message: 'Sidebar width set to {width}px.',
      },
      {
        name: 'handleSetColorMode',
        type: 'function',
        args: ['mode'],
        message: 'Color mode set to {mode}.',
      },
      {
        name: 'handleSetLanguage',
        type: 'function',
        args: ['language'],
        message: 'Language set to {language}.',
      },
    ],
    decisions: [
      { tool: 'incrementCounter', actions: ['handleIncrement'] },
      { tool: 'fillContactForm', actions: ['fillFields'] },
      { tool: 'clearForm', actions: ['clearFields'] },
      { tool: 'submitForm', actions: ['submitContactForm'] },
      { tool: 'switchTab', actions: ['handleSwitchTab'] },
      { tool: 'setSidebarWidth', actions: ['handleSetSidebarWidth'] },
      { tool: 'setColorMode', actions: ['handleSetColorMode'] },
      { tool: 'setLanguage', actions: ['handleSetLanguage'] },
    ],
    inference: {
      kind: 'inference',
      name: 'default',
      spec: {
        name: 'envoy-default',
      },
    },
  };
}

export function createPlaygroundFunctions(
  setForm: React.Dispatch<React.SetStateAction<FormState>>,
  setTab: React.Dispatch<React.SetStateAction<string>>,
  setSubmitted: React.Dispatch<React.SetStateAction<boolean>>,
  setCounter: React.Dispatch<React.SetStateAction<number>>,
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>,
  setColorMode: React.Dispatch<React.SetStateAction<ColorMode>>,
  setLanguage: React.Dispatch<React.SetStateAction<Language>>,
): FunctionRegistry {
  return {
    handleIncrement: (args: Record<string, unknown>) => {
      const amount = Number(args.amount) || 1;
      setCounter((prev) => prev + amount);
      return { success: true };
    },
    fillFields: (args: Record<string, unknown>) => {
      setForm((prev) => ({
        ...prev,
        ...(args.fullName != null && { name: String(args.fullName) }),
        ...(args.emailAddress != null && { email: String(args.emailAddress) }),
        ...(args.phoneNumber != null && { phone: String(args.phoneNumber) }),
        ...(args.subject != null && { subject: String(args.subject) }),
        ...(args.messageBody != null && { message: String(args.messageBody) }),
      }));
      return { success: true };
    },
    clearFields: () => {
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setSubmitted(false);
      return { success: true };
    },
    submitContactForm: () => {
      setSubmitted(true);
      return { success: true };
    },
    handleSwitchTab: (args: Record<string, unknown>) => {
      setTab(String(args.tab));
      return { success: true };
    },
    handleSetSidebarWidth: (args: Record<string, unknown>) => {
      const requestedWidth = Number(args.width);
      const width = Number.isFinite(requestedWidth)
        ? clampSidebarWidth(requestedWidth)
        : MIN_SIDEBAR_WIDTH;

      setSidebarWidth(width);
      return { success: true, width };
    },
    handleSetColorMode: (args: Record<string, unknown>) => {
      const mode = args.mode === 'dark' ? 'dark' : 'light';
      setColorMode(mode);
      return { success: true, mode };
    },
    handleSetLanguage: (args: Record<string, unknown>) => {
      const language = args.language === 'en' ? 'en' : 'nb';
      setLanguage(language);
      return { success: true, language };
    },
  };
}

export const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};
