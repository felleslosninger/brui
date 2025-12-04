# brui

## Setup

### 1. Install Dependencies

**Ollama** (local LLM inference)
```sh
# Download from https://ollama.com/
# Then pull the model:
ollama pull qwen3:0.6b
```

**Go** (v1.25+)
```sh
# Download from https://go.dev/dl/
```

**Node.js** (v18+)
```sh
# Download from https://nodejs.org/
```

### 2. Install UI Dependencies

```sh
cd ui
npm install
```

### 3. Start the Proxy Server

```sh
cd server
go run .
```

Server runs on `http://localhost:8091`

### 4. Run Bøgwald's Pizza Demo

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
2. Request goes through the Go proxy to Ollama (qwen3:0.6b)
3. LLM interprets intent and calls appropriate tools from [`lab/bogwalds_pizza/src/config.json`](lab/bogwalds_pizza/src/config.json)
4. Actions execute in [`lab/bogwalds_pizza/src/App.tsx`](lab/bogwalds_pizza/src/App.tsx)

## Troubleshooting

**"Connection refused"**
- Make sure Ollama is running: `ollama list`
- Check proxy server is running on port 8091

**Tool calls not working**
- Try simpler prompts like "go to menu"

**Model errors**
- Verify model downloaded: `ollama list`
- Test directly: `ollama run qwen3:0.6b "Hello"`

## Configuration

**Available tools** are defined in [`lab/bogwalds_pizza/src/config.json`](lab/bogwalds_pizza/src/config.json):
- `addPizza` - Add items to order
- `changeActiveTab` - Navigate tabs
- `fillForm` - Auto-fill form fields

**Proxy targets** are in [`server/config.yaml`](server/config.yaml):
- `local-nano` - Local Ollama (default)
- `external-nano` - Remote Ollama instance
