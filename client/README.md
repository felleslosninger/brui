# brui-client

TypeScript client that orchestrates LLM inference, tool-call routing, and action execution. It connects your application logic to an LLM via the brui proxy server.

## Install

```bash
npm install brui-client
```

## Usage

### 1. Create a configuration

A `Configuration` defines what the LLM can do (tools), what your app executes (actions), and how they connect (decisions).

```ts
import type { Configuration } from 'brui-client';

const config: Configuration = {
  // Tools are OpenAI-compatible function definitions sent to the LLM
  tools: [
    {
      type: 'function',
      function: {
        name: 'fillContactForm',
        description: 'Fill in the contact form.',
        parameters: {
          type: 'object',
          properties: {
            fullName: { type: 'string', description: 'Full name' },
            email: { type: 'string', description: 'Email address' },
          },
          required: ['fullName', 'email'],
        },
      },
    },
  ],

  // Actions map to local functions you register
  actions: [
    {
      name: 'fillFields',
      type: 'function',
      args: ['fullName', 'email'],
      message: 'Filled form for {fullName}.',
    },
  ],

  // Decisions connect tool calls to actions
  decisions: [
    { tool: 'fillContactForm', actions: ['fillFields'] },
  ],

  // Inference target (must match a key in server/config.yaml)
  inference: {
    kind: 'inference',
    name: 'proxy',
    spec: {
      name: 'envoy-default',
      endpoint: 'http://localhost:8091',
    },
  },
};
```

### 2. Register functions and set up

```ts
import { Setup } from 'brui-client';
import type { FunctionRegistry } from 'brui-client';

const functions: FunctionRegistry = {
  fillFields: (args: Record<string, unknown>) => {
    console.log('Filling form with', args);
    return { success: true };
  },
};

const run = Setup(config, functions);
```

### 3. Execute

```ts
const result = await run('Fill the form for Alice at alice@example.com');
// result: { success: true, content: "Filled form for Alice." }
```

## API

### `Setup(config, functions)`

Returns an async function `(input, metadata?, events?) => Promise<ExecutionResult>`.

**Parameters:**
- `config` — `Configuration` object (tools, actions, decisions, inference)
- `functions` — `FunctionRegistry` mapping action names to handler functions

**Metadata (optional):**
- `interactionMode` — `'Act'` (call tools) or `'Info'` (text-only responses)
- `conversationHistory` — array of `{ role, content }` messages for multi-turn context
- `context` — arbitrary JSON context passed to the LLM

### Event handlers

```ts
const result = await run('Do something', { interactionMode: 'Act' }, {
  onThinking: (text) => { /* LLM thinking/reasoning text */ },
  onContentStream: (text) => { /* streamed response chunks */ },
  onToolCallsKnown: (actions) => { /* all planned actions */ },
  onActionPending: (event) => { /* action queued */ },
  onActionStart: (event) => { /* action executing */ },
  onActionComplete: (event, result) => { /* action succeeded */ },
  onActionError: (event, error) => { /* action failed */ },
});
```

### Types

```ts
interface ExecutionResult {
  success: boolean;
  content?: string;
  error?: string;
}

type FunctionRegistry = Record<string, Function>;

interface Configuration {
  tools: ToolDefinition[];
  actions: Action[];
  decisions: Decision[];
  inference?: Inference;
}
```

## How it works

1. `Setup` creates a resource store from your config and functions.
2. When called, it sends the user input + tool definitions to the proxy server.
3. The LLM either responds with text or tool calls.
4. Tool calls are mapped via decisions to actions, which execute your registered functions.
5. A summary response is generated and returned.