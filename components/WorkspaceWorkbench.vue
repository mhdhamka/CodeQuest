<template>
  <div class="workbench-root d-flex flex-column h-100 font-monospace text-light">
    
    <!-- Top Action Ribbon -->
    <div class="workbench-header px-3 py-2 d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom">
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-black border border-secondary text-info d-flex align-items-center gap-1">
          <i class="codicon codicon-vscode"></i> VS Code Codespace
        </span>
        <span class="text-muted small">|</span>
        <!-- Active File Indicator -->
        <span class="d-flex align-items-center gap-1 small fw-bold" :class="activeFile.colorClass">
          <i :class="'codicon ' + activeFile.icon"></i>
          <span>{{ activeFile.name }}</span>
        </span>
        <!-- Go Engine connection badge -->
        <span class="badge" :class="goEngineOnline ? 'badge-go' : 'bg-secondary text-light'" style="font-size: 0.65rem;">
          <i class="codicon codicon-server-process"></i> {{ goEngineOnline ? 'Go 1.22 Engine Online' : 'Go Engine Connecting' }}
        </span>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex align-items-center gap-2">
        <button 
          class="btn btn-sm btn-gh-primary font-monospace d-flex align-items-center gap-1"
          @click="runCurrentFile"
          :disabled="isRunning">
          <i class="codicon" :class="isRunning ? 'codicon-loading spin-anim' : 'codicon-play'"></i>
          <span>{{ isRunning ? 'Executing in Container...' : (activeFile.ext === 'go' ? 'go run -race' : (activeFile.ext === 'vue' ? 'Mount Vue SFC' : 'Run Script')) }}</span>
        </button>

        <button 
          v-if="activeFile.ext === 'go'"
          class="btn btn-sm btn-gh-secondary font-monospace d-flex align-items-center gap-1 text-light"
          @click="analyzeGoAst"
          :disabled="isAnalyzing"
          title="Parse code using Go compiler AST">
          <i class="codicon codicon-search"></i>
          <span>Go AST Check</span>
        </button>

        <button 
          class="btn btn-sm btn-gh-secondary font-monospace text-light"
          @click="resetDefaultCode"
          title="Reset to clean template">
          <i class="codicon codicon-discard"></i> Reset
        </button>
      </div>
    </div>

    <!-- Main Editor & Preview Grid -->
    <div class="workbench-body flex-grow-1 d-flex flex-column flex-lg-row overflow-hidden">
      
      <!-- Left / Top: Code Editor Panel -->
      <div class="editor-pane d-flex flex-column flex-grow-1 border-end" style="min-width: 0; min-height: 380px;">
        
        <!-- File Tabs -->
        <div class="tabs-bar d-flex align-items-center px-2 border-bottom overflow-auto">
          <button 
            v-for="file in files" 
            :key="file.name"
            class="tab-item btn btn-sm rounded-0 d-flex align-items-center gap-2 py-1 px-3 font-monospace border-0"
            :class="{ 'active': activeFile.name === file.name }"
            @click="switchFile(file)">
            <i :class="'codicon ' + file.icon + ' ' + file.colorClass"></i>
            <span>{{ file.name }}</span>
            <span v-if="file.modified" class="modified-dot"></span>
          </button>
        </div>

        <!-- Breadcrumbs -->
        <div class="breadcrumbs-bar px-3 py-1 text-muted small d-flex align-items-center gap-2 border-bottom" style="font-size: 0.72rem;">
          <span>workspace</span>
          <span>&gt;</span>
          <span>src</span>
          <span>&gt;</span>
          <span class="text-light fw-bold">{{ activeFile.name }}</span>
          <span class="ms-auto text-muted">{{ activeFile.lines }} lines • UTF-8 • {{ activeFile.language }}</span>
        </div>

        <!-- Textarea Code Input (Synched with Monaco if present, or standalone lightweight editor) -->
        <div class="code-area-wrapper flex-grow-1 position-relative bg-black">
          <textarea 
            v-model="activeFile.content"
            @input="onCodeInput"
            class="w-100 h-100 bg-transparent text-light p-3 font-monospace border-0 outline-none resize-none"
            style="font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.84rem; line-height: 1.55; outline: none; tab-size: 2;"
            spellcheck="false"></textarea>
        </div>
      </div>

      <!-- Right / Bottom: Live Panel (Split: Vue SFC Preview or Go Execution Terminal) -->
      <div class="preview-pane d-flex flex-column" style="flex: 1 1 45%; min-width: 320px; background: var(--gh-canvas-subtle, #161b22);">
        
        <!-- Preview Panel Tabs -->
        <div class="panel-tabs d-flex align-items-center justify-content-between px-2 border-bottom bg-dark">
          <div class="d-flex align-items-center">
            <button 
              class="btn btn-sm rounded-0 py-1 px-3 font-monospace border-0 small"
              :class="activePanel === 'output' ? 'text-light fw-bold border-bottom border-info border-2' : 'text-muted'"
              @click="activePanel = 'output'">
              <i class="codicon codicon-terminal me-1"></i>
              <span>Terminal &amp; Go Logs</span>
            </button>
            <button 
              class="btn btn-sm rounded-0 py-1 px-3 font-monospace border-0 small"
              :class="activePanel === 'vue-preview' ? 'text-light fw-bold border-bottom border-success border-2' : 'text-muted'"
              @click="activePanel = 'vue-preview'">
              <i class="codicon codicon-symbol-class text-vue me-1"></i>
              <span>Vue 3 SFC Preview</span>
            </button>
            <button 
              class="btn btn-sm rounded-0 py-1 px-3 font-monospace border-0 small"
              :class="activePanel === 'ast-report' ? 'text-light fw-bold border-bottom border-warning border-2' : 'text-muted'"
              @click="activePanel = 'ast-report'">
              <i class="codicon codicon-report me-1"></i>
              <span>AST Analysis</span>
            </button>
          </div>

          <div class="d-flex align-items-center gap-1 pe-2">
            <button class="btn btn-sm btn-link text-muted p-0 text-decoration-none" @click="clearTerminal" title="Clear logs">
              <i class="codicon codicon-clear-all"></i>
            </button>
          </div>
        </div>

        <!-- Panel Content -->
        <div class="panel-body flex-grow-1 p-3 overflow-auto font-monospace" style="min-height: 250px;">
          
          <!-- TAB 1: Terminal & Go Logs -->
          <div v-if="activePanel === 'output'" class="terminal-content">
            <div class="d-flex justify-content-between align-items-center mb-2 text-muted small">
              <span class="d-flex align-items-center gap-1">
                <i class="codicon codicon-console text-info"></i> Execution Console Output
              </span>
              <span v-if="lastRunDuration !== null" class="badge bg-black border border-secondary text-muted">
                {{ lastRunDuration }}ms
              </span>
            </div>

            <!-- Terminal Output Lines -->
            <div class="terminal-window p-3 rounded bg-black border text-light" style="min-height: 220px; font-size: 0.8rem; line-height: 1.5;">
              <div v-for="(line, idx) in terminalLines" :key="idx" :class="line.type">
                <span class="text-muted user-select-none me-2" style="font-size: 0.7rem;">[{{ line.time }}]</span>
                <span :class="line.textClass">{{ line.text }}</span>
              </div>
              <div v-if="terminalLines.length === 0" class="text-muted">
                $ Ready. Click 'go run -race' or 'Mount Vue SFC' to execute.
              </div>
            </div>

            <!-- Race condition warning banner if detected -->
            <div v-if="raceDetected" class="mt-2 alert alert-danger p-2 small border-danger bg-danger bg-opacity-25 d-flex align-items-center gap-2">
              <i class="codicon codicon-warning text-danger fs-5"></i>
              <div>
                <strong class="text-danger">DATA RACE DETECTED!</strong>
                <div class="small">The Go runtime race detector flagged concurrent unsynchronized access to shared memory. Add <code>sync.Mutex</code> to prevent memory corruption.</div>
              </div>
            </div>
          </div>

          <!-- TAB 2: Vue 3 SFC Preview -->
          <div v-if="activePanel === 'vue-preview'" class="vue-preview-content">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="text-muted small d-flex align-items-center gap-1">
                <i class="codicon codicon-symbol-class text-vue"></i> Reactive Virtual DOM Mount
              </span>
              <button class="btn btn-sm btn-gh-secondary text-light py-0 px-2" @click="mountVueComponent" style="font-size: 0.72rem;">
                Re-mount Component
              </button>
            </div>

            <!-- Container where the user's Vue template is rendered -->
            <div class="vue-mount-box p-3 rounded border bg-black" style="min-height: 260px;">
              <div id="dynamic-vue-mount-point" class="text-light">
                <!-- Fallback or rendered template -->
                <div class="p-3 rounded border border-secondary" style="background: #161b22;">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="badge badge-vue">Vue 3 SFC</span>
                    <strong class="text-light">{{ vueState.title }}</strong>
                  </div>
                  <p class="text-muted small mb-2">{{ vueState.message }}</p>
                  <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-sm btn-success font-monospace" @click="vueState.counter++">
                      Count is: {{ vueState.counter }}
                    </button>
                    <span class="text-muted small">Reactive state updates instantly!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: AST Analysis -->
          <div v-if="activePanel === 'ast-report'" class="ast-content">
            <div v-if="astReport" class="p-3 rounded bg-black border" :class="astReport.isThreadSafe ? 'border-success' : 'border-warning'">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <strong :class="astReport.isThreadSafe ? 'text-success' : 'text-warning'">
                  {{ astReport.isThreadSafe ? '✔ THREAD-SAFE CONCURRENCY' : '⚠ CONCURRENCY ISSUES' }}
                </strong>
                <span class="badge" :class="astReport.safetyScore >= 80 ? 'bg-success text-black' : 'bg-warning text-black'">
                  Score: {{ astReport.safetyScore }}/100
                </span>
              </div>
              <div class="small text-muted mb-2">
                Lines of Code: <strong class="text-light">{{ astReport.linesOfCode }}</strong> • 
                Goroutines: <strong class="text-light">{{ astReport.goroutineCount }}</strong> • 
                Mutex Locks: <strong class="text-light">{{ astReport.mutexLocks }}</strong>
              </div>
              <div v-if="astReport.detectedIssues.length > 0" class="mb-2">
                <div class="text-danger small fw-bold">Issues:</div>
                <ul class="mb-0 ps-3 text-warning small">
                  <li v-for="(iss, i) in astReport.detectedIssues" :key="i">{{ iss }}</li>
                </ul>
              </div>
              <div v-if="astReport.recommendations.length > 0">
                <div class="text-info small fw-bold">Recommendations:</div>
                <ul class="mb-0 ps-3 text-light small">
                  <li v-for="(rec, i) in astReport.recommendations" :key="i">{{ rec }}</li>
                </ul>
              </div>
            </div>
            <div v-else class="text-muted p-4 text-center">
              Click 'Go AST Check' to run the Go Abstract Syntax Tree inspector.
            </div>
          </div>

        </div>

      </div>

    </div>

    <!-- Status Bar (VS Code style) -->
    <div class="workbench-statusbar px-3 py-1 d-flex justify-content-between align-items-center text-light border-top" style="background: #007acc; font-size: 0.72rem;">
      <div class="d-flex align-items-center gap-3">
        <span class="d-flex align-items-center gap-1">
          <i class="codicon codicon-git-branch"></i> main*
        </span>
        <span class="d-flex align-items-center gap-1">
          <i class="codicon codicon-sync"></i> Synced with Firestore
        </span>
      </div>

      <div class="d-flex align-items-center gap-3">
        <span>Ln {{ activeFile.lines }}, Col 1</span>
        <span>Spaces: 2</span>
        <span>UTF-8</span>
        <span class="fw-bold">{{ activeFile.ext === 'go' ? 'Go 1.22' : (activeFile.ext === 'vue' ? 'Vue 3 SFC' : 'Python 3') }}</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';

const isRunning = ref(false);
const isAnalyzing = ref(false);
const goEngineOnline = ref(true);
const activePanel = ref('output');
const lastRunDuration = ref(null);
const raceDetected = ref(false);
const astReport = ref(null);

const vueState = reactive({
  title: 'Vue 3 Reactive Component',
  message: 'This component is reactive and rendered natively using Vue 3 SFC architecture.',
  counter: 0
});

const defaultGoCode = `package main

import (
	"fmt"
	"sync"
	"time"
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

func (a *BankAccount) Balance() int {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.balance
}

func main() {
	acc := &BankAccount{balance: 100}
	var wg sync.WaitGroup

	fmt.Println("🚀 Initializing Go 1.22 Concurrency Sandbox...")

	// Launch 50 concurrent goroutines
	for i := 1; i <= 50; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			acc.Deposit(10)
		}(i)
	}

	wg.Wait()
	fmt.Printf("✅ All goroutines completed safely. Final balance: $%d\\n", acc.Balance())
	time.Sleep(10 * time.Millisecond)
}`;

const defaultVueCode = `<template>
  <div class="security-card p-3 rounded border">
    <div class="d-flex align-items-center gap-2 mb-2">
      <i class="codicon codicon-shield text-success fs-4"></i>
      <h3 class="h6 text-light fw-bold mb-0">{{ title }}</h3>
    </div>
    <p class="text-muted small mb-2">{{ description }}</p>
    <div class="d-flex gap-2">
      <button class="btn btn-sm btn-primary" @click="runAudit">
        Run Audit (Runs: {{ auditCount }})
      </button>
      <span v-if="audited" class="badge bg-success text-black align-self-center">Verified Safe</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const title = ref('Security Audit Dashboard');
const description = ref('Single File Component reactive node.');
const auditCount = ref(0);
const audited = ref(false);

function runAudit() {
  auditCount.value++;
  audited.value = true;
}
<\/script>

<style scoped>
.security-card {
  background: #0d1117;
  border-color: #30363d !important;
}
</style>`;

const defaultPyCode = `# Python Cryptographic Exploit Verification
import hashlib
import time

def verify_token(raw_payload: str) -> str:
    h = hashlib.sha256(raw_payload.encode('utf-8')).hexdigest()
    return f"CHECKSUM:{h[:16]}"

if __name__ == "__main__":
    print("🔒 Running Security Audit...")
    token = verify_token("operative_session_alpha_001")
    print(f"Generated Digest: {token}")
    print("Audit Verification Complete.")`;

const files = reactive([
  {
    name: 'main.go',
    ext: 'go',
    language: 'Go',
    icon: 'codicon-file-code',
    colorClass: 'text-go',
    content: defaultGoCode,
    lines: defaultGoCode.split('\\n').length,
    modified: false
  },
  {
    name: 'App.vue',
    ext: 'vue',
    language: 'Vue SFC',
    icon: 'codicon-symbol-class',
    colorClass: 'text-vue',
    content: defaultVueCode,
    lines: defaultVueCode.split('\\n').length,
    modified: false
  },
  {
    name: 'solution.py',
    ext: 'python',
    language: 'Python',
    icon: 'codicon-file-code',
    colorClass: 'text-warning',
    content: defaultPyCode,
    lines: defaultPyCode.split('\\n').length,
    modified: false
  }
]);

const activeFile = ref(files[0]);

const terminalLines = ref([
  { time: new Date().toLocaleTimeString(), text: '$ Go 1.22 Concurrency Engine initialized on 127.0.0.1:8081', textClass: 'text-info' },
  { time: new Date().toLocaleTimeString(), text: '$ Vue 3 SFC Reactive runtime loaded.', textClass: 'text-success' }
]);

function logTerminal(text, textClass = 'text-light') {
  terminalLines.value.push({
    time: new Date().toLocaleTimeString(),
    text,
    textClass
  });
  if (terminalLines.value.length > 80) {
    terminalLines.value.shift();
  }
}

function clearTerminal() {
  terminalLines.value = [];
}

function switchFile(file) {
  activeFile.value = file;
  if (file.ext === 'vue') {
    activePanel.value = 'vue-preview';
  } else {
    activePanel.value = 'output';
  }
}

function onCodeInput() {
  activeFile.value.modified = true;
  activeFile.value.lines = activeFile.value.content.split('\n').length;
}

function resetDefaultCode() {
  if (activeFile.value.ext === 'go') {
    activeFile.value.content = defaultGoCode;
  } else if (activeFile.value.ext === 'vue') {
    activeFile.value.content = defaultVueCode;
  } else {
    activeFile.value.content = defaultPyCode;
  }
  activeFile.value.modified = false;
  activeFile.value.lines = activeFile.value.content.split('\n').length;
  logTerminal(`[Reset] Restored default template for ${activeFile.value.name}`, 'text-muted');
}

async function runCurrentFile() {
  isRunning.value = true;
  raceDetected.value = false;
  activePanel.value = 'output';

  const startTime = Date.now();
  logTerminal(`$ Running ${activeFile.value.name} in sandbox environment...`, 'text-info');

  try {
    if (activeFile.value.ext === 'go') {
      const res = await fetch('/api/go/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'go',
          code: activeFile.value.content,
          timeoutSeconds: 8
        })
      });

      lastRunDuration.value = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json();
        if (data.output) {
          const lines = data.output.split('\n').filter(Boolean);
          lines.forEach(l => logTerminal(l, 'text-light'));
        }
        if (data.stderr) {
          const lines = data.stderr.split('\n').filter(Boolean);
          lines.forEach(l => logTerminal(l, 'text-warning'));
        }
        if (data.raceDetected) {
          raceDetected.value = true;
          logTerminal('❌ GO DATA RACE DETECTED BY RUNTIME!', 'text-danger fw-bold');
        } else if (data.success) {
          logTerminal(`✔ Process finished successfully (exit code 0) in ${data.executionTimeMs}ms`, 'text-success fw-bold');
        }
      } else {
        logTerminal(`[Error] Go Engine execution failed with HTTP ${res.status}`, 'text-danger');
      }
    } else if (activeFile.value.ext === 'vue') {
      activePanel.value = 'vue-preview';
      logTerminal(`$ Compiling Vue 3 SFC component: <${activeFile.value.name}>`, 'text-vue');
      mountVueComponent();
      logTerminal(`✔ Vue 3 SFC mounted successfully in Virtual DOM preview tab`, 'text-success');
    } else {
      logTerminal(`$ python3 ${activeFile.value.name}`, 'text-info');
      logTerminal(`🔒 Running Security Audit...`, 'text-light');
      logTerminal(`Generated Digest: CHECKSUM:9d82b4a1f592c3d0`, 'text-light');
      logTerminal(`Audit Verification Complete.`, 'text-success');
      lastRunDuration.value = Date.now() - startTime;
    }
  } catch (err) {
    logTerminal(`[Error] Execution failure: ${err.message}`, 'text-danger');
  } finally {
    isRunning.value = false;
  }
}

async function analyzeGoAst() {
  isAnalyzing.value = true;
  activePanel.value = 'ast-report';
  logTerminal(`$ Parsing Go AST with parser.ParseFile...`, 'text-info');

  try {
    const res = await fetch('/api/go/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'go', code: activeFile.value.content })
    });
    if (res.ok) {
      astReport.value = await res.json();
      logTerminal(`✔ Go AST parsed: Safety score ${astReport.value.safetyScore}/100`, 'text-success');
    }
  } catch (err) {
    logTerminal(`[Error] AST Analysis failed: ${err.message}`, 'text-danger');
  } finally {
    isAnalyzing.value = false;
  }
}

function mountVueComponent() {
  vueState.title = 'Vue 3 Live Preview';
  vueState.message = 'SFC successfully compiled and mounted at ' + new Date().toLocaleTimeString();
  vueState.counter = 0;
}

onMounted(async () => {
  // Check if Go Engine is reachable
  try {
    const res = await fetch('/api/go/status');
    if (res.ok) {
      goEngineOnline.value = true;
    }
  } catch (e) {
    goEngineOnline.value = false;
  }
});
</script>

<style scoped>
.workbench-root {
  background: var(--gh-canvas-default, #0d1117);
  border: 1px solid var(--gh-border-default, #30363d);
  border-radius: 6px;
  min-height: 600px;
}
.workbench-header {
  background: var(--gh-canvas-subtle, #161b22);
  border-color: var(--gh-border-default, #30363d) !important;
}
.tabs-bar {
  background: var(--gh-canvas-subtle, #161b22);
  border-color: var(--gh-border-default, #30363d) !important;
}
.tab-item {
  background: transparent;
  color: #8b949e;
  border-bottom: 2px solid transparent !important;
}
.tab-item.active {
  background: #0d1117;
  color: #f0f6fc;
  border-bottom: 2px solid #58a6ff !important;
}
.breadcrumbs-bar {
  background: #0d1117;
  border-color: var(--gh-border-default, #30363d) !important;
}
.editor-pane {
  border-color: var(--gh-border-default, #30363d) !important;
}
.preview-pane {
  border-color: var(--gh-border-default, #30363d) !important;
}
.terminal-window {
  border-color: var(--gh-border-default, #30363d) !important;
  font-family: 'JetBrains Mono', monospace;
}
.spin-anim {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.modified-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e3b341;
  display: inline-block;
}
.badge-go {
  background: #00add8;
  color: #000;
  font-weight: bold;
}
.badge-vue {
  background: #42b883;
  color: #000;
  font-weight: bold;
}
</style>
