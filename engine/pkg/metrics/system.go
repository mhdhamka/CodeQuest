package metrics

import (
	"runtime"
	"time"
)

type SystemTelemetry struct {
	GoVersion    string    `json:"goVersion"`
	Architecture string    `json:"architecture"`
	NumCPU       int       `json:"numCPU"`
	Goroutines   int       `json:"goroutines"`
	MemoryAlloc  uint64    `json:"memoryAllocBytes"`
	MemorySys    uint64    `json:"memorySysBytes"`
	HeapAlloc    uint64    `json:"heapAllocBytes"`
	NumGC        uint32    `json:"numGC"`
	UptimeSec    int64     `json:"uptimeSeconds"`
	Timestamp    time.Time `json:"timestamp"`
}

var startTime = time.Now()

func GetTelemetry() SystemTelemetry {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	return SystemTelemetry{
		GoVersion:    runtime.Version(),
		Architecture: runtime.GOARCH + "/" + runtime.GOOS,
		NumCPU:       runtime.NumCPU(),
		Goroutines:   runtime.NumGoroutine(),
		MemoryAlloc:  m.Alloc,
		MemorySys:    m.Sys,
		HeapAlloc:    m.HeapAlloc,
		NumGC:        m.NumGC,
		UptimeSec:    int64(time.Since(startTime).Seconds()),
		Timestamp:    time.Now().UTC(),
	}
}
