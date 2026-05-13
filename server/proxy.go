package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strings"
	"time"
)

const HttpPort = ":8091"

func proxyHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	origin := strings.TrimSpace(r.Header.Get("Origin"))
	if origin != "" {
		if !isAllowedOrigin(origin) {
			http.Error(w, "Origin not allowed", http.StatusForbidden)
			return
		}

		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Add("Vary", "Origin")
	}

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

	if _, hasTools := payloadMap["tools"]; hasTools {
		if _, hasToolChoice := payloadMap["tool_choice"]; !hasToolChoice {
			payloadMap["tool_choice"] = "auto"
		}
	}

	modifiedPayload, err := json.Marshal(payloadMap)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal rewritten payload: %w", err)
	}

	return modifiedPayload, nil
}

func isStreamingRequest(payload []byte) bool {
	var peek struct {
		Stream bool `json:"stream"`
	}
	_ = json.Unmarshal(payload, &peek)
	return peek.Stream
}

func send(payload []byte, pr ProxyRequest, r *http.Request, w http.ResponseWriter) {
	req, err := http.NewRequestWithContext(r.Context(), r.Method, string(TargetMap[pr.Target].Endpoint), bytes.NewBuffer(payload))
	if err != nil {
		http.Error(w, "Error creating request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("─── Request to %s ───", pr.Target)
	log.Printf("  Endpoint: %s", TargetMap[pr.Target].Endpoint)
	log.Printf("  Model:    %s", TargetMap[pr.Target].Model)

	req.Header.Set("Content-Type", "application/json")
	expandedHeaders, err := expandHeaders(TargetMap[pr.Target].Headers, TargetMap[pr.Target].Model)
	if err != nil {
		http.Error(w, "Error expanding headers: "+err.Error(), http.StatusInternalServerError)
		return
	}

	for key, value := range expandedHeaders {
		req.Header.Set(key, value)
	}

	client := &http.Client{Timeout: 120 * time.Second}

	resp, err := client.Do(req)

	if err != nil {
		http.Error(w, "Error proxying request: "+err.Error(), http.StatusBadGateway)
		return
	}

	defer resp.Body.Close()

	if isStreamingRequest(payload) {
		sendStreaming(resp, pr, w)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("  Error reading response body: %v", err)
		http.Error(w, "Error reading upstream response", http.StatusBadGateway)
		return
	}

	log.Printf("─── Response from %s (HTTP %d) ───", pr.Target, resp.StatusCode)

	if contentType := resp.Header.Get("Content-Type"); contentType != "" {
		w.Header().Set("Content-Type", contentType)
	}

	w.WriteHeader(resp.StatusCode)
	if _, err := w.Write(body); err != nil {
		log.Printf("Error writing response body for target %s: %v", pr.Target, err)
	}
}

func sendStreaming(resp *http.Response, pr ProxyRequest, w http.ResponseWriter) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}

	log.Printf("─── Streaming response from %s (HTTP %d) ───", pr.Target, resp.StatusCode)

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.WriteHeader(resp.StatusCode)

	buf := make([]byte, 4096)
	for {
		n, err := resp.Body.Read(buf)
		if n > 0 {
			if _, writeErr := w.Write(buf[:n]); writeErr != nil {
				log.Printf("Error writing streaming chunk for target %s: %v", pr.Target, writeErr)
				return
			}
			flusher.Flush()
		}
		if err != nil {
			if err != io.EOF {
				log.Printf("Error reading streaming response from %s: %v", pr.Target, err)
			}
			return
		}
	}
}

func isAllowedOrigin(origin string) bool {
	host := origin
	if parsed, err := url.Parse(origin); err == nil && parsed.Host != "" {
		host = parsed.Hostname()
	}

	if ip := net.ParseIP(host); ip != nil {
		return ip.IsLoopback()
	}

	return host == "localhost"
}

func expandHeaders(headers map[string]string, model string) (map[string]string, error) {
	if len(headers) == 0 {
		return nil, nil
	}

	expanded := make(map[string]string, len(headers))
	for key, value := range headers {
		missingVars := map[string]struct{}{}
		expandedValue := os.Expand(value, func(variable string) string {
			switch variable {
			case "MODEL", "TARGET_MODEL":
				return model
			default:
				if resolved, ok := os.LookupEnv(variable); ok {
					return resolved
				}

				missingVars[variable] = struct{}{}
				return ""
			}
		})

		if len(missingVars) > 0 {
			var names []string
			for variable := range missingVars {
				names = append(names, variable)
			}
			sort.Strings(names)

			return nil, fmt.Errorf("missing environment variables in header %q: %s", key, strings.Join(names, ", "))
		}

		expanded[key] = expandedValue
	}

	return expanded, nil
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
