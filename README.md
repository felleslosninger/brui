# brui


### Running locally

#### ollama

Ollama is required locally, download from https://ollama.com/  

Download required model: 

`ollama pull qwen3:0.6b`

#### LLM proxy

Go is required: https://go.dev/dl/

```
cd proxy
go run .
```

#### UI

```
cd lab/site0/ 
npm install (if not already installed)
npm run dev
```

Enter prompts to initiate tool calls in the input field. Tools possible to trigger can be found via "Available tools" button.
