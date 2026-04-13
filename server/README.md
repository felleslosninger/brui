# brui server

Go proxy server that forwards OpenAI-compatible chat completion requests to configured LLM endpoints. It handles model injection, header expansion, and streaming.

## Quick start

```bash
cd server
go run .
```

The server starts on port **8091** by default.

## Configuration

Create a `config.yaml` in the server directory:

```yaml
inference:
  # Local Ollama instance
  local-nano:
    endpoint: "http://localhost:11434/v1/chat/completions"
    model: "qwen3:0.6b"

  # Remote endpoint with auth
  envoy-default:
    endpoint: "https://your-gateway.example.com/v1/chat/completions"
    model: "gpt-4o"
    headers:
      Authorization: "Bearer ${ENVOY_API_KEY}"
      x-ai-eg-model: "${MODEL}"
```

Each key under `inference` is a **target name** that the client references via `config.inference.spec.name`.

### Environment variable expansion

Header values support `${VAR}` syntax. Variables are resolved from the environment at request time.

## API

### `POST /`

The server accepts a JSON body with two fields:

```json
{
  "target": "envoy-default",
  "payload": { /* OpenAI chat completion request body */ }
}
```

- **`target`** — one of the keys from `config.yaml`
- **`payload`** — a standard OpenAI-compatible chat completion request (messages, tools, etc.)

The server:
1. Looks up the target configuration
2. Injects the configured `model` into the payload
3. Sets `tool_choice: "auto"` if tools are present
4. Expands environment variables in headers
5. Forwards the request to the target endpoint
6. Streams or returns the response to the client

### CORS

The server allows requests from `localhost` and loopback IPs only.

### Streaming

If the payload includes `"stream": true`, the server streams the response back using Server-Sent Events (SSE).

## Integration with the client

The client's `inference.spec` field points at this server:

```ts
inference: {
  kind: 'inference',
  name: 'proxy',
  spec: {
    name: 'envoy-default',  // matches config.yaml key
    endpoint: 'http://localhost:8091',  // server address
  },
}
```

The client sends requests to the proxy, which routes them to the correct LLM endpoint based on the target name.