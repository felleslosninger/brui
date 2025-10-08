package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
)

const HttpPort = ":8091"

func proxyHandler(w http.ResponseWriter, r *http.Request) {

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	proxyReq := parse(r)
	modifiedPayload, err := rewrite(proxyReq)
	if err != nil {
		http.Error(w, "Error rewriting request: "+err.Error(), http.StatusBadRequest)
		return
	}

	send(modifiedPayload, proxyReq, r, w)
}

func parse(r *http.Request) ProxyRequest {
	var pr ProxyRequest
	_ = json.NewDecoder(r.Body).Decode(&pr)
	return pr
}

func rewrite(proxyReq ProxyRequest) ([]byte, error) {
	target, exists := TargetMap[proxyReq.Target]
	if !exists {
		return nil, fmt.Errorf("unknown target: %s", proxyReq.Target)
	}

	var payloadMap map[string]interface{}
	if err := json.Unmarshal(proxyReq.Payload, &payloadMap); err != nil {
		return nil, fmt.Errorf("invalid payload JSON: %w", err)
	}

	payloadMap["model"] = target.Model

	modifiedPayload, err := json.Marshal(payloadMap)
	if err != nil {
		return nil, fmt.Errorf("error marshaling modified payload: %w", err)
	}

	return modifiedPayload, nil
}

func send(payload []byte, pr ProxyRequest, r *http.Request, w http.ResponseWriter) {
	req, err := http.NewRequest(r.Method, string(TargetMap[pr.Target].Endpoint), bytes.NewBuffer(payload))

	fmt.Println("Proxying request to:", pr.Target)

	if err != nil {
		http.Error(w, "Error creating request", http.StatusInternalServerError)
		return
	}

	client := &http.Client{}

	resp, err := client.Do(req)

	if err != nil {
		http.Error(w, "Error proxying request: "+err.Error(), http.StatusBadGateway)
		return
	}

	defer resp.Body.Close()

	io.Copy(w, resp.Body)
}

func Run() {
	if err := LoadConfig("config.yaml"); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	log.Printf("Starting proxy server on %s", HttpPort)
	log.Printf("Loaded %d inference configurations", len(TargetMap))

	http.HandleFunc("/", proxyHandler)

	if err := http.ListenAndServe(HttpPort, nil); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
