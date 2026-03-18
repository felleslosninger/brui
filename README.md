# brui

## Setup

### 1. Install Dependencies

> **Note:** Inference is routed through the local Go proxy. The pizza demo currently defaults to `envoy-default`, so you need to set `ENVOY_API_KEY` before starting the proxy. If you want to use local Ollama instead, change the inference `name` in [`lab/bogwalds_pizza/src/config.json`](lab/bogwalds_pizza/src/config.json) to `local-nano`.

**Ollama** (local LLM inference)
```sh
# Download from https://ollama.com/
# Then pull the model:
ollama pull qwen3:0.6b
```

**Envoy AI Gateway** (OpenAI-compatible upstream)
Set an API key before starting the proxy:
```sh
export ENVOY_API_KEY=your-api-key
```

The proxy target in [`server/config.yaml`](server/config.yaml) sends `Authorization: Bearer ${ENVOY_API_KEY}` and mirrors the configured model into the required `x-ai-eg-model` header.

**Go** (v1.25+)
```sh
# Download from https://go.dev/dl/
```

**Node.js** (v20.19+)
```sh
# Download from https://nodejs.org/
```

### 2. Install Root Dependencies

```sh
npm install
```

This installs the type-only `openai` dependency used by the shared client inference types.

### 3. Install UI Dependencies

```sh
cd ui
npm install
```

### 4. Start the Proxy Server

```sh
cd server
go run .
```

Server runs on `http://localhost:8091`

### 5. Run Bøgwald's Pizza Demo

```sh
cd lab/bogwalds_pizza
npm install
npm run dev
```

## Try It Out

Type these prompts in the chat sidebar:

**Navigation:**
- "Show me the menu"
- "Go to the order page"
- "Fill form with name Alice, table 3, order 456, then go to order"

## How It Works

1. User types natural language in the sidebar
2. The client sends a generic tool-calling request to the Go proxy
3. The proxy rewrites the request for the selected upstream target and adds the configured model
4. The upstream model interprets intent and calls appropriate tools from [`lab/bogwalds_pizza/src/config.json`](lab/bogwalds_pizza/src/config.json)
5. The proxy returns an OpenAI-compatible chat completion response for every target
6. Actions execute in [`lab/bogwalds_pizza/src/App.tsx`](lab/bogwalds_pizza/src/App.tsx)

## Troubleshooting

**"Connection refused"**
- Make sure Ollama is running: `ollama list`
- Check proxy server is running on port 8091

**Model errors**
- Verify model downloaded: `ollama list`
- Test directly: `ollama run qwen3:0.6b "Hello"`

**Envoy target errors**
- Check that the `envoy-default` endpoint in [`server/config.yaml`](server/config.yaml) points to your gateway's `/v1/chat/completions` route
- Verify `ENVOY_API_KEY` is set in the shell where you start `go run .`
- Verify the configured `model` matches a model exposed by the gateway; the proxy mirrors it into the `x-ai-eg-model` header

## Configuration

**Available tools** are defined in [`lab/bogwalds_pizza/src/config.json`](lab/bogwalds_pizza/src/config.json):
- `addPizza` - Add items to order
- `changeActiveTab` - Navigate tabs
- `fillForm` - Auto-fill form fields

**Proxy targets** are in [`server/config.yaml`](server/config.yaml):
- `local-nano` - Local Ollama (default)
- `external-nano` - Remote Ollama instance
- `envoy-default` - Envoy AI Gateway using the OpenAI-compatible chat completions API

Each proxy target defines:
- `endpoint` - Upstream chat endpoint.
- `model` - Model name sent by the proxy. For gateway targets, the same value is also available as `${MODEL}` inside headers.
- `headers` - Optional request headers. Environment variables in values are expanded by the proxy.
