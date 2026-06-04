# brui

brui lets an LLM control your web application through natural language. It connects a chat interface to your app by mapping LLM tool calls to local functions you define.

The system has three parts:

| Package | Description | README |
| --- | --- | --- |
| `client/` | TypeScript client that orchestrates inference, tool-call routing, and action execution | [client/README.md](client/README.md) |
| `server/` | Go proxy server that forwards OpenAI-compatible requests to configured LLM endpoints | [server/README.md](server/README.md) |
| `ui/` | React sidebar component for chat-based interaction | [ui/README.md](ui/README.md) |

## Contents

- [Quick start](#quick-start)
- [How it works](#how-it-works)
- [Using brui in your app](#using-brui-in-your-app)
- [Concepts](#concepts)
- [Voice input (optional)](#voice-input-optional)
- [Event handlers](#event-handlers)
- [Repo Layout](#repo-layout)
- [Server Integration](#server-integration)
- [Client Integration](#client-integration)
- [Real Working References In This Repo](#real-working-references-in-this-repo)
- [Troubleshooting](#troubleshooting)

## Quick start

The fastest way to see brui working is the bundled **lab** demo — a small React app the LLM drives through natural language. You need Node for the client, UI, and lab; Go is only needed for the proxy server.

### 1. Install dependencies

```sh
cd client && npm install
cd ../ui && npm install
cd ../lab && npm install
```

### 2. Configure a model target

```sh
cp server/config.example.yaml server/config.yaml
```

`server/config.yaml` ships with two targets — use whichever you have:

- **`local`** — a local [Ollama](https://ollama.com) instance, no API key required:

  ```yaml
  local:
    endpoint: "http://localhost:11434/v1/chat/completions"
    model: "your-model-name"
  ```

- **`remote`** — a hosted OpenAI-compatible endpoint with an API key:

  ```yaml
  remote:
    endpoint: "https://api.example.com/v1/chat/completions"
    model: "your-model-name"
    headers:
      Authorization: "Bearer ${API_KEY}"
  ```

The lab points at the **`remote`** target by default. To run fully locally against Ollama instead, change `inference.spec.name` to `'local'` in [`lab/src/config.ts`](lab/src/config.ts). See [server/README.md](server/README.md) for the full target reference.

### 3. Start the proxy

```sh
# export API_KEY=... first if your target uses an auth header
cd server
go run .
```

The proxy listens on `http://localhost:8091`.

### 4. Start the lab

```sh
cd lab
npm run dev
```

Open the printed URL and drive the demo app through the sidebar.

## How it works

1. The user sends a message through the UI sidebar.
2. The **client** sends the message (with tool definitions) to the **server** proxy.
3. The **server** forwards the request to a configured LLM endpoint and streams the response back.
4. The **client** maps any returned tool calls to **actions**, then executes the registered **functions**.
5. The result is summarized and displayed in the UI.

## Using brui in your app

To embed brui in your own web app, install the client, declare your tools and actions, register the functions that run them, and point the client at a proxy target.

### 1. Install the client

```bash
npm install brui-client
```

### 2. Define your configuration

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
        name: 'remote', // must match a key in server/config.yaml
        endpoint: 'http://localhost:8091',
      },
    },
  };
}
```

### 3. Register functions and set up the client

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

### 4. Configure the server target

The client's `inference.spec.name` (`'remote'` above) must match a target key in `server/config.yaml`. See [Quick start](#quick-start) for creating that file and [server/README.md](server/README.md) for the full target reference.

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

## Voice input (optional)

The sidebar UI ships with optional voice input that sends recorded audio to any Whisper-compatible HTTP endpoint (OpenAI `/audio/transcriptions`, `whisper.cpp`, self-hosted servers, etc.).

Enable it by adding `transcribe` to your `Configuration`:

```ts
const config: Configuration = {
  // ...tools, actions, decisions, inference...
  transcribe: {
    endpoint: 'https://your-whisper-endpoint.example.com/v1/audio/transcriptions',
    // Optional:
    // headers: { Authorization: 'Bearer ...' },
    // model: 'whisper-1',
    // language: 'nb',
    // responseFormat: 'json',         // 'json' | 'verbose_json' | 'text'
    // silenceThreshold: 0.04,         // RMS threshold for silence detection
    // silenceAutoFlushMs: 900,        // ms of silence before flushing an utterance
    // minUtteranceMs: 250,            // ignore utterances shorter than this
    // requestTimeoutMs: 30000,        // per-utterance fetch timeout
  },
};
```

Configuring `transcribe` enables the mic button in the sidebar. Using voice input requires browser support for `MediaRecorder` + `getUserMedia` (HTTPS or localhost required). Audio is captured per utterance — recording restarts after each silence flush, so each POST is a clean, self-contained blob. RMS-driven animation in the Send button gives live visual feedback while you speak.

For the lab app, copy the env example and set your transcription endpoint locally:

```bash
cp lab/.env.example lab/.env.local
```

```env
VITE_TRANSCRIBE_ENDPOINT=https://your-whisper-endpoint.example.com/v1/audio/transcriptions
```

Restart `npm run dev` after changing Vite env files. `lab/.env.local` stays untracked; `lab/.env.example` is the committed template.

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

## Repo Layout

- [`README.md`](README.md): top-level integration guide
- [`server/config.example.yaml`](server/config.example.yaml): copyable proxy target config (copy to `server/config.yaml`)
- [`lab/src/config.ts`](lab/src/config.ts): fuller real app example
- [`lab/src/App.tsx`](lab/src/App.tsx): demo UI wiring

## Server Integration

The Go server accepts a request shaped like this:

```json
{
  "target": "remote",
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

Start from [`server/config.example.yaml`](server/config.example.yaml):

```yaml
inference:
  local:
    endpoint: "http://localhost:11434/v1/chat/completions"
    model: "your-model-name"

  remote:
    endpoint: "https://api.example.com/v1/chat/completions"
    model: "your-model-name"
    headers:
      Authorization: "Bearer ${API_KEY}"
```

Each target supports:

- `endpoint`: upstream OpenAI-compatible `/v1/chat/completions` URL
- `model`: model name injected by the proxy
- `headers`: optional headers; environment variables like `${API_KEY}` are expanded at runtime

The proxy also expands `${MODEL}` and `${TARGET_MODEL}` to the target's configured `model`, so you can inject it into a header if an endpoint requires it.

## Client Integration

Start from [`examples/client/config.ts`](examples/client/config.ts). It shows the four pieces the client needs:

- `tools`: function definitions exposed to the model
- `actions`: local action handlers with optional status messages
- `decisions`: mapping from model tool name to one or more local actions
- `inference`: proxy endpoint plus target name

The key line is:

```ts
spec: {
  name: 'remote',
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
    () => createExampleConfig('remote', 'http://localhost:8091'),
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
