package main

import "encoding/json"

type InferenceConfig struct {
	Endpoint string            `json:"endpoint" yaml:"endpoint"`
	Model    string            `json:"model" yaml:"model"`
	Headers  map[string]string `json:"headers,omitempty" yaml:"headers,omitempty"`
}

type ProxyRequest struct {
	Target  string          `json:"target"`
	Payload json.RawMessage `json:"payload"`
}

type inferenceConfigs map[string]InferenceConfig
