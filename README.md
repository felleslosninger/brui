# brui

brui lets an LLM control your web application through natural language. It connects a chat interface to your app by mapping LLM tool calls to local functions you define.

The system has three parts:

| Package | Description |
|---------|-------------|
| `client/` | TypeScript client that orchestrates inference, tool-call routing, and action execution |
| `server/` | Go proxy server that forwards OpenAI-compatible requests to configured LLM endpoints |
| `ui/` | React sidebar component for chat-based interaction |

## How it works

1. The user sends a message through the UI sidebar.
2. The **client** sends the message (with tool definitions) to the **server** proxy.
3. The **server** forwards the request to a configured LLM endpoint and streams the response back.
4. The **client** maps any returned tool calls to **actions**, then executes the registered **functions**.
5. The result is summarized and displayed in the UI.

## Quick start

### 1. Start the proxy server

```bash
cd server
# Configure your targets in config.yaml (see server/README.md)
go run .
```

The server listens on `:8091` by default.

### 2. Install the client

```bash
npm install brui-client
```

### 3. Define your configuration

Create a config that declares which **tools** the LLM can call, which **actions** to execute, and how they map together:

```ts
// config.ts
import type { Configuration, FunctionRegistry } from 'brui-client';

export function createConfig(): Configuration {
  return {
    tools: [
      {
        type: 'function',
        function: {
          name: 'fillContactForm',
          description: 'Fill in the contact form with the provided values.',
          parameters: {
            type: 'object',
            properties: {
              fullName: { type: 'string', description: 'Full name' },
              emailAddress: { type: 'string', description: 'Email address' },
              messageBody: { type: 'string', description: 'Message body' },
            },
            required: ['fullName', 'emailAddress'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'clearForm',
          description: 'Clear the contact form.',
          parameters: { type: 'object', properties: {} },
        },
      },
    ],

    actions: [
      {
        name: 'fillFields',
        type: 'function',
        args: ['fullName', 'emailAddress', 'messageBody'],
        message: 'Filled contact form for {fullName}.',
      },
      {
        name: 'clearFields',
        type: 'function',
        args: [],
        message: 'Cleared the contact form.',
      },
    ],

    decisions: [
      { tool: 'fillContactForm', actions: ['fillFields'] },
      { tool: 'clearForm', actions: ['clearFields'] },
    ],

    inference: {
      kind: 'inference',
      name: 'proxy',
      spec: {
        name: 'envoy-default', // must match a key in server/config.yaml
        endpoint: 'http://localhost:8091',
      },
    },
  };
}
```

### 4. Register functions and set up the client

```ts
// app.ts
import { Setup } from 'brui-client';
import type { FunctionRegistry } from 'brui-client';
import { createConfig } from './config';

const config = createConfig();

// Map action names to the functions that execute them
const functions: FunctionRegistry = {
  fillFields: (args: Record<string, unknown>) => {
    document.querySelector<HTMLInputElement>('#name')!.value = String(args.fullName ?? '');
    document.querySelector<HTMLInputElement>('#email')!.value = String(args.emailAddress ?? '');
    return { success: true };
  },
  clearFields: () => {
    document.querySelector<HTMLFormElement>('#contact-form')!.reset();
    return { success: true };
  },
};

const run = Setup(config, functions);

// Execute a natural-language command
const result = await run('Fill the contact form for Alice at alice@example.com');
console.log(result);
```

### 5. Server configuration

Create `server/config.yaml` to define LLM targets:

```yaml
inference:
  local-nano:
    endpoint: "http://localhost:11434/v1/chat/completions"
    model: "qwen3:0.6b"

  envoy-default:
    endpoint: "https://your-gateway.example.com/v1/chat/completions"
    model: "gpt-4o"
    headers:
      Authorization: "Bearer ${ENVOY_API_KEY}"
```

Environment variables in header values (e.g. `${ENVOY_API_KEY}`) are expanded at runtime.

## Concepts

### Tools
OpenAI-compatible function definitions sent to the LLM. They describe what actions are available.

### Actions
Named operations that map to local functions. Each action specifies which arguments to extract from the tool call and an optional user-facing message template.

### Decisions
The glue between tools and actions. A decision says "when the LLM calls tool X, execute actions [A, B]".

### Functions
A `FunctionRegistry` is a plain object mapping action names to functions. Each function receives the extracted arguments and returns `{ success: boolean }`.

### Inference
Configured via the `inference` field pointing at a target defined in the server's `config.yaml`. The client sends requests to the proxy server, which forwards them to the actual LLM endpoint.

## Event handlers

The `run` function accepts optional event handlers for observability:

```ts
const result = await run('Do something', { interactionMode: 'Act' }, {
  onThinking: (text) => console.log('Thinking:', text),
  onContentStream: (text) => process.stdout.write(text),
  onActionStart: (event) => console.log('Starting:', event.action),
  onActionComplete: (event, result) => console.log('Done:', event.action),
  onActionError: (event, error) => console.error('Failed:', event.action, error),
});
```

## License

See individual packages for details.
# brui

`brui` has three main parts:

- [`server/`](server) is a Go proxy for OpenAI-compatible chat completion requests.
- [`client/`](client) maps model tool calls to local application actions.
- [`ui/`](ui) provides a ready-made React sidebar UI on top of the client.

The demo app in [`lab/`](lab) shows how those pieces fit together.

## How The Integration Works

1. Your app defines `tools`, `actions`, `decisions`, and `inference` in a `config.ts` file.
2. Your app provides a function registry that implements the configured actions.
3. The client sends the selected inference target and OpenAI-style payload to the Go proxy.
4. The proxy rewrites the request with the configured upstream `model` and optional headers.
5. The model returns tool calls, and the client executes the mapped local actions in your app.

The important connection point is this:

- `config.ts -> inference.spec.name` must match a target name in [`server/config.yaml`](server/config.yaml).

## Repo Layout

- [`README.md`](README.md): top-level integration guide
- [`server/config.yaml`](server/config.yaml): live proxy target config used by the repo
- [`examples/server/config.yaml`](examples/server/config.yaml): copyable server example
- [`examples/client/config.ts`](examples/client/config.ts): copyable client `config.ts` example
- [`lab/src/config.ts`](lab/src/config.ts): fuller real app example
- [`lab/src/App.tsx`](lab/src/App.tsx): demo UI wiring

## Quick Start

### Requirements

- Go `1.25+`
- Node.js `20.19+`

### Install Dependencies

```sh
cd client && npm install
cd ../ui && npm install
cd ../lab && npm install
```

### Start The Proxy

If you use a gateway target with auth headers, export the required environment variables first:

```sh
export ENVOY_API_KEY=your-api-key
cd server
go run .
```

The proxy listens on `http://localhost:8091`.

### Start The Demo App

```sh
cd lab
npm run dev
```

## Server Integration

The Go server accepts a request shaped like this:

```json
{
  "target": "envoy-default",
  "payload": {
    "messages": [
      { "role": "user", "content": "Open the contact page" }
    ],
    "tools": [],
    "stream": true
  }
}
```

You usually do not construct that request by hand because the client does it for you, but the target name still matters because it selects which upstream model config the proxy should use.

Start from [`examples/server/config.yaml`](examples/server/config.yaml):

```yaml
inference:
  local-nano:
    endpoint: "http://localhost:11434/v1/chat/completions"
    model: "qwen3:0.6b"

  envoy-default:
    endpoint: "https://your-gateway.example.com/v1/chat/completions"
    model: "gpt-5"
    headers:
      Authorization: "Bearer ${ENVOY_API_KEY}"
      x-ai-eg-model: "${MODEL}"
```

Each target supports:

- `endpoint`: upstream OpenAI-compatible `/v1/chat/completions` URL
- `model`: model name injected by the proxy
- `headers`: optional headers; environment variables like `${ENVOY_API_KEY}` are expanded at runtime

`"${MODEL}"` and `"{TARGET_MODEL}"` style substitutions are also supported by the proxy, so you can mirror the configured model into provider-specific headers.

## Client Integration

Start from [`examples/client/config.ts`](examples/client/config.ts). It shows the four pieces the client needs:

- `tools`: function definitions exposed to the model
- `actions`: local action handlers with optional status messages
- `decisions`: mapping from model tool name to one or more local actions
- `inference`: proxy endpoint plus target name

The key line is:

```ts
spec: {
  name: 'envoy-default',
  endpoint: 'http://localhost:8091',
}
```

`name` must match a key under `inference:` in the server YAML.

### `config.ts` Example

[`examples/client/config.ts`](examples/client/config.ts) includes:

- `createExampleConfig()`: returns the full `Configuration`
- `createExampleFunctions()`: returns the matching `FunctionRegistry`
- `emptyExampleForm`: convenient initial form state

That example is intentionally small, but it follows the same pattern as the larger demo in [`lab/src/config.ts`](lab/src/config.ts).

### React Wiring Example

If you want the ready-made sidebar UI, pass `config` and `functions` into `Sidebar`:

```tsx
import { useMemo, useState } from 'react';
import { Sidebar } from '@brui/ui';
import {
  createExampleConfig,
  createExampleFunctions,
  emptyExampleForm,
  type ExampleFormState,
  type ExampleTab,
} from './config';

export function App() {
  const [form, setForm] = useState<ExampleFormState>(emptyExampleForm);
  const [activeTab, setActiveTab] = useState<ExampleTab>('home');
  const [submitted, setSubmitted] = useState(false);

  const config = useMemo(
    () => createExampleConfig('envoy-default', 'http://localhost:8091'),
    [],
  );

  const functions = useMemo(
    () => createExampleFunctions(setForm, setActiveTab, setSubmitted),
    [],
  );

  return <Sidebar config={config} functions={functions} />;
}
```

If you do not want the sidebar component, you can call [`Setup`](client/brui.ts) directly and wire the returned function into your own UI flow.

## Real Working References In This Repo

- [`lab/src/config.ts`](lab/src/config.ts) shows a fuller config with more tools and actions.
- [`lab/src/App.tsx`](lab/src/App.tsx) shows a complete React integration.
- [`ui/src/components/hooks/useToolRunner.ts`](ui/src/components/hooks/useToolRunner.ts) shows how the sidebar builds conversation history and runs the client.
- [`server/proxy.go`](server/proxy.go) shows how the proxy injects the configured model and headers.

## Troubleshooting

**`unknown target`**

- Make sure `config.ts -> inference.spec.name` matches a key in `server/config.yaml`.

**Auth header errors**

- Verify the required environment variables are exported in the same shell where you start `go run .`.

**Client cannot reach the proxy**

- Make sure the proxy is running on `http://localhost:8091`.
- If you changed the port, update `inference.spec.endpoint` in your client config.

**No tool calls happen**

- Make sure you defined tools in `config.ts`.
- Make sure the tool names in `decisions` exactly match the tool names exposed to the model.
- Make sure the action names in `decisions` exactly match the keys in your function registry.
