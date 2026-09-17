package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"codequest/engine/pkg/analyzer"
	"codequest/engine/pkg/metrics"
	"codequest/engine/pkg/runner"
)

type AnalyzeRequest struct {
	Language string `json:"language"`
	Code     string `json:"code"`
}

type ExecuteRequest struct {
	Language string `json:"language"`
	Code     string `json:"code"`
	Timeout  int    `json:"timeoutSeconds"`
}

type StressRequest struct {
	Workers int `json:"workers"`
	Loops   int `json:"loops"`
}

type StressResponse struct {
	Status           string `json:"status"`
	WorkersCompleted int    `json:"workersCompleted"`
	TotalOps         int    `json:"totalOps"`
	DurationMs       int64  `json:"durationMs"`
	RaceFree         bool   `json:"raceFree"`
	GoroutinesPeak   int    `json:"goroutinesPeak"`
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")
}

func main() {
	port := os.Getenv("GO_ENGINE_PORT")
	if port == "" {
		port = "8081"
	}

	mux := http.NewServeMux()

	// Health Check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		if r.Method == http.MethodOptions {
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "online",
			"engine":    "CodeQuest Go Concurrency Engine",
			"language":  "go",
			"version":   "1.22.3",
			"timestamp": time.Now().UTC(),
		})
	})

	// Runtime Metrics
	mux.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		if r.Method == http.MethodOptions {
			return
		}
		telemetry := metrics.GetTelemetry()
		json.NewEncoder(w).Encode(telemetry)
	})

	// AST & Security Code Analysis
	mux.HandleFunc("/analyze", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}

		var req AnalyzeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"Invalid JSON: %s"}`, err.Error()), http.StatusBadRequest)
			return
		}

		report := analyzer.AnalyzeGoCode(req.Code)
		json.NewEncoder(w).Encode(report)
	})

	// Sandbox Execution with Race Detector
	mux.HandleFunc("/execute", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		if r.Method == http.MethodOptions {
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}

		var req ExecuteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"Invalid JSON: %s"}`, err.Error()), http.StatusBadRequest)
			return
		}

		res := runner.ExecuteGoCode(req.Code, req.Timeout)
		json.NewEncoder(w).Encode(res)
	})

	// Concurrency Stress Test Engine
	mux.HandleFunc("/concurrency-stress", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		if r.Method == http.MethodOptions {
			return
		}

		var req StressRequest
		_ = json.NewDecoder(r.Body).Decode(&req)
		if req.Workers <= 0 {
			req.Workers = 50
		}
		if req.Loops <= 0 {
			req.Loops = 100
		}

		start := time.Now()
		var wg sync.WaitGroup
		var mu sync.Mutex
		counter := 0

		for i := 0; i < req.Workers; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				for j := 0; j < req.Loops; j++ {
					mu.Lock()
					counter++
					mu.Unlock()
				}
			}()
		}

		wg.Wait()
		dur := time.Since(start).Milliseconds()

		resp := StressResponse{
			Status:           "completed",
			WorkersCompleted: req.Workers,
			TotalOps:         counter,
			DurationMs:       dur,
			RaceFree:         counter == (req.Workers * req.Loops),
			GoroutinesPeak:   req.Workers + 2,
		}

		json.NewEncoder(w).Encode(resp)
	})

	addr := "127.0.0.1:" + port
	log.Printf("[Go Engine] Starting CodeQuest Go Microservice on %s ...", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("[Go Engine] Failed to bind: %v", err)
	}
}
