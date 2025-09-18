package main

import "encoding/json"

type InferenceConfig struct {
    Endpoint string `json:"endpoint"`
    Model    string `json:"model"`
}

type ProxyRequest struct {
    Target  string         `json:"target"`
    Payload json.RawMessage `json:"payload"`
}

type inferenceConfigs map[string]InferenceConfig