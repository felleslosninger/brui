package main

var HttpPort = ":8080"

var TargetMap = inferenceConfigs {
	"local-nano": { 
		Endpoint: "http://localhost:11434/api/chat", 
		Model: "qwen3:0.6b",
	},
	"external-nano": { 
		Endpoint: "https://ollama.sandkasse.ai/api/chat", 
		Model: "qwen3:0.6b",
	},
}
