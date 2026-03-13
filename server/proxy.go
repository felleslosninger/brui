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

func send(payload []byte, pr ProxyRequest, r *http.Request, w http.ResponseWriter) {
	req, err := http.NewRequestWithContext(r.Context(), r.Method, string(TargetMap[pr.Target].Endpoint), bytes.NewBuffer(payload))
	if err != nil {
		http.Error(w, "Error creating request", http.StatusInternalServerError)
		return
	}

	fmt.Println("Proxying request to:", pr.Target)

	req.Header.Set("Content-Type", "application/json")
	for key, value := range expandHeaders(TargetMap[pr.Target].Headers, TargetMap[pr.Target].Model) {
		req.Header.Set(key, value)
	}

	client := &http.Client{Timeout: 60 * time.Second}

	resp, err := client.Do(req)

	if err != nil {
		http.Error(w, "Error proxying request: "+err.Error(), http.StatusBadGateway)
		return
	}

	defer resp.Body.Close()

	if contentType := resp.Header.Get("Content-Type"); contentType != "" {
		w.Header().Set("Content-Type", contentType)
	}

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
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

func expandHeaders(headers map[string]string, model string) map[string]string {
	if len(headers) == 0 {
		return nil
	}

	expanded := make(map[string]string, len(headers))
	for key, value := range headers {
		expanded[key] = os.Expand(value, func(variable string) string {
			switch variable {
			case "MODEL", "TARGET_MODEL":
				return model
			default:
				return os.Getenv(variable)
			}
		})
	}

	return expanded
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
