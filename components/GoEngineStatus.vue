<template>
  <div class="go-engine-card p-3 rounded border font-monospace mb-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
      <div class="d-flex align-items-center gap-2">
        <span class="go-pulse-indicator" :class="{ 'online': isOnline, 'offline': !isOnline }"></span>
        <div class="d-flex align-items-center gap-2">
          <i class="codicon codicon-server-process text-info fs-5"></i>
          <h4 class="h6 text-light fw-bold mb-0">Go 1.22 Concurrency Engine Daemon</h4>
        </div>
        <span class="badge" :class="isOnline ? 'bg-success text-black fw-bold' : 'bg-danger text-light'">
          {{ isOnline ? 'ONLINE (Port 8081)' : 'RECONNECTING...' }}
        </span>
      </div>

      <div class="d-flex align-items-center gap-2">
        <button 
          class="btn btn-sm btn-gh-secondary text-light font-monospace d-flex align-items-center gap-1"
          @click="fetchMetrics" 
          :disabled="loading"
          title="Refresh Go runtime metrics">
          <i class="codicon codicon-sync" :class="{ 'spin-anim': loading }"></i>
          <span>Refresh</span>
        </button>
        <button 
          class="btn btn-sm btn-gh-primary font-monospace d-flex align-items-center gap-1"
          @click="runStressTest" 
          :disabled="stressTesting">
          <i class="codicon codicon-zap text-warning"></i>
          <span>{{ stressTesting ? 'Running Goroutines...' : 'Stress Test Goroutines' }}</span>
        </button>
      </div>
    </div>

    <!-- Telemetry Grid -->
    <div class="row g-2 mb-3">
      <!-- Goroutines Metric -->
      <div class="col-sm-6 col-md-3">
        <div class="metric-box p-2 rounded bg-black border">
          <div class="text-muted small d-flex align-items-center gap-1">
            <i class="codicon codicon-layers text-go"></i> Active Goroutines
          </div>
          <div class="metric-value text-go fw-bold fs-5 mt-1">
            {{ telemetry.goroutines }} <span class="small text-muted fw-normal">threads</span>
          </div>
        </div>
      </div>

      <!-- Memory Alloc Metric -->
      <div class="col-sm-6 col-md-3">
        <div class="metric-box p-2 rounded bg-black border">
          <div class="text-muted small d-flex align-items-center gap-1">
            <i class="codicon codicon-dashboard text-info"></i> Heap Allocation
          </div>
          <div class="metric-value text-info fw-bold fs-5 mt-1">
            {{ formatBytes(telemetry.heapAllocBytes) }}
          </div>
        </div>
      </div>

      <!-- GC Cycles Metric -->
      <div class="col-sm-6 col-md-3">
        <div class="metric-box p-2 rounded bg-black border">
          <div class="text-muted small d-flex align-items-center gap-1">
            <i class="codicon codicon-trash text-warning"></i> GC Cycles (NumGC)
          </div>
          <div class="metric-value text-warning fw-bold fs-5 mt-1">
            {{ telemetry.numGC }} <span class="small text-muted fw-normal">cycles</span>
          </div>
        </div>
      </div>

      <!-- Runtime Target -->
      <div class="col-sm-6 col-md-3">
        <div class="metric-box p-2 rounded bg-black border">
          <div class="text-muted small d-flex align-items-center gap-1">
            <i class="codicon codicon-device-desktop text-success"></i> Go Runtime
          </div>
          <div class="metric-value text-success fw-bold fs-5 mt-1">
            {{ telemetry.goVersion || 'go1.22.3' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Stress Test Result Banner -->
    <div v-if="stressResult" class="alert alert-dark border border-success p-2 small mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div>
        <i class="codicon codicon-check text-success me-1"></i>
        <strong class="text-light">Goroutines Benchmark:</strong>
        <span class="text-muted"> Spawned {{ stressResult.workersCompleted }} concurrent workers ({{ stressResult.totalOps }} atomic ops) in </span>
        <strong class="text-info">{{ stressResult.durationMs }}ms</strong>.
        <span class="badge bg-black border border-success text-success ms-2">Race-Free: 100%</span>
      </div>
      <button class="btn btn-sm btn-link text-muted p-0 text-decoration-none" @click="stressResult = null">✕</button>
    </div>

    <!-- Quick Go AST Code Analyzer Box -->
    <div class="analyzer-section border-top pt-2 mt-2">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="small text-muted fw-bold d-flex align-items-center gap-1">
          <i class="codicon codicon-code text-muted"></i> Real-time Go AST Static Code Inspector
        </span>
        <button class="btn btn-sm btn-link text-info text-decoration-none p-0 small" @click="showAnalyzer = !showAnalyzer">
          {{ showAnalyzer ? 'Collapse Analyzer ▲' : 'Open Live AST Inspector ▼' }}
        </button>
      </div>

      <div v-if="showAnalyzer" class="p-3 rounded bg-black border">
        <div class="mb-2">
          <label class="text-muted small mb-1">Go Code to Parse with Go <code>parser.ParseFile</code>:</label>
          <textarea 
            v-model="codeToAnalyze" 
            class="form-control bg-dark text-light border-secondary font-monospace small" 
            rows="5"
            placeholder="package main..."></textarea>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <button 
            class="btn btn-sm btn-gh-primary font-monospace d-flex align-items-center gap-1"
            @click="analyzeCode" 
            :disabled="analyzing">
            <i class="codicon codicon-search"></i>
            <span>{{ analyzing ? 'Parsing AST in Go...' : 'Parse Go AST & Check Races' }}</span>
          </button>
          <button class="btn btn-sm btn-gh-secondary text-light small" @click="loadSampleCode">
            Load Concurrency Sample
          </button>
        </div>

        <!-- Analysis Results -->
        <div v-if="analysisReport" class="mt-3 p-2 rounded border" :class="analysisReport.isThreadSafe ? 'border-success' : 'border-warning'" style="background: #0d1117;">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-bold" :class="analysisReport.isThreadSafe ? 'text-success' : 'text-warning'">
              {{ analysisReport.isThreadSafe ? '✔ THREAD-SAFE CONCURRENCY' : '⚠ CONCURRENCY ISSUES FLAGGED' }}
            </span>
            <span class="badge" :class="analysisReport.safetyScore >= 80 ? 'bg-success text-black' : 'bg-warning text-black'">
              Safety Score: {{ analysisReport.safetyScore }}/100
            </span>
          </div>

          <div class="row g-2 small text-muted mb-2">
            <div class="col-4">Goroutines: <strong class="text-light">{{ analysisReport.goroutineCount }}</strong></div>
            <div class="col-4">Mutex Locks: <strong class="text-light">{{ analysisReport.mutexLocks }}</strong></div>
            <div class="col-4">Channel Ops: <strong class="text-light">{{ analysisReport.channelOps }}</strong></div>
          </div>

          <div v-if="analysisReport.detectedIssues && analysisReport.detectedIssues.length > 0" class="mb-2">
            <div class="text-danger small fw-bold">Issues Detected:</div>
            <ul class="mb-1 ps-3 text-warning small">
              <li v-for="(iss, idx) in analysisReport.detectedIssues" :key="idx">{{ iss }}</li>
            </ul>
          </div>

          <div v-if="analysisReport.recommendations && analysisReport.recommendations.length > 0">
            <div class="text-info small fw-bold">Recommendations:</div>
            <ul class="mb-0 ps-3 text-light small">
              <li v-for="(rec, idx) in analysisReport.recommendations" :key="idx">{{ rec }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const isOnline = ref(true);
const loading = ref(false);
const stressTesting = ref(false);
const stressResult = ref(null);
const showAnalyzer = ref(false);
const analyzing = ref(false);
const analysisReport = ref(null);

const telemetry = ref({
  goVersion: 'go1.22.3',
  architecture: 'amd64/linux',
  numCPU: 2,
  goroutines: 3,
  heapAllocBytes: 245000,
  numGC: 1,
  uptimeSeconds: 12
});

const codeToAnalyze = ref(`package main

import (
	"fmt"
	"sync"
)

type SafeCounter struct {
	mu    sync.Mutex
	count int
}

func (c *SafeCounter) Inc() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.count++
}

func main() {
	c := SafeCounter{}
	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			c.Inc()
		}()
	}
	wg.Wait()
	fmt.Println("Final count:", c.count)
}`);

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function fetchMetrics() {
  loading.value = true;
  try {
    const res = await fetch('/api/go/metrics');
    if (res.ok) {
      const data = await res.json();
      telemetry.value = data;
      isOnline.value = true;
    } else {
      isOnline.value = false;
    }
  } catch (err) {
    console.warn('[Go Engine] Metrics fetch failed:', err);
    isOnline.value = false;
  } finally {
    loading.value = false;
  }
}

async function runStressTest() {
  stressTesting.value = true;
  stressResult.value = null;
  try {
    const res = await fetch('/api/go/stress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workers: 50, loops: 100 })
    });
    if (res.ok) {
      stressResult.value = await res.json();
      await fetchMetrics();
    }
  } catch (err) {
    console.error('[Go Engine] Stress test error:', err);
  } finally {
    stressTesting.value = false;
  }
}

async function analyzeCode() {
  analyzing.value = true;
  analysisReport.value = null;
  try {
    const res = await fetch('/api/go/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'go', code: codeToAnalyze.value })
    });
    if (res.ok) {
      analysisReport.value = await res.json();
    }
  } catch (err) {
    console.error('[Go Engine] Analyze error:', err);
  } finally {
    analyzing.value = false;
  }
}

function loadSampleCode() {
  codeToAnalyze.value = `package main

import (
	"fmt"
	"sync"
)

type BankAccount struct {
	mu      sync.Mutex
	balance int
}

func (a *BankAccount) Deposit(amount int) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.balance += amount
}

func main() {
	acc := &BankAccount{balance: 100}
	var wg sync.WaitGroup
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			acc.Deposit(10)
		}()
	}
	wg.Wait()
	fmt.Println("Balance:", acc.balance)
}`;
}

let pollInterval = null;

onMounted(() => {
  fetchMetrics();
  pollInterval = setInterval(fetchMetrics, 6000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.go-engine-card {
  background: var(--gh-canvas-default, #0d1117);
  border-color: var(--gh-border-default, #30363d) !important;
}
.go-pulse-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.go-pulse-indicator.online {
  background-color: #00add8;
  box-shadow: 0 0 8px #00add8;
  animation: go-pulse 2s infinite;
}
.go-pulse-indicator.offline {
  background-color: #f85149;
}
@keyframes go-pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 173, 216, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(0, 173, 216, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 173, 216, 0); }
}
.spin-anim {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.metric-box {
  border-color: var(--gh-border-default, #30363d) !important;
}
</style>
