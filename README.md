<div align="center">

# CodeQuest Arena (WIP)
### Modernized GitHub & VS Code Codespace Platform

**An interactive multi-language developer arena combining GitHub repository intelligence, VS Code Codespaces editing, Go 1.22 (`.go`) concurrency microservices, Vue 3 Single-File Components (`.vue`), and gamified CTF security raids.**

[Live Codespace](http://localhost:3000) · [Report Issue](https://github.com/mhdhamka/CodeQuest/issues) · [Request Feature](https://github.com/mhdhamka/CodeQuest/issues)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go 1.22](https://img.shields.io/badge/Go-1.22.3-00ADD8?logo=go&logoColor=white)](https://golang.org)
[![Vue 3](https://img.shields.io/badge/Vue-3.5%20SFC-42B883?logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20Sync-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![VS Code Theme](https://img.shields.io/badge/UI-GitHub%20%26%20VS%20Code-007ACC?logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com)

</div>

---

## Overview

**CodeQuest Arena** is a developer platform inspired by **GitHub repository intelligence** and **VS Code Codespaces**. It harmoniously combines **5 core languages** into a single cohesive runtime:

- **EJS (`.ejs`)**: High-performance server-side templating for layout scaffolding, SSR pages, and component framing.
- **JavaScript (`.js`)**: Express server orchestration, session management, and client-side reactive bridges.
- **CSS (`.css`)**: Authentic VS Code Dark+ and GitHub Dark dimmed themes with customizable Codicon iconography and responsive breakpoints.
- **Vue 3 (`.vue`)**: Single-File Components (SFCs) loaded on-the-fly via `vue3-sfc-loader` with `<template>`, `<script setup>`, and `<style scoped>`.
- **Go (`.go`)**: Dedicated Go 1.22 microservice engine (`/engine`) delivering live AST code parsing, goroutine concurrency telemetry, and sandboxed code execution.

---

## Architecture & Technology Stack

```plaintext
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                  │
│                                                                              │
│   ┌─────────────────────────────┐        ┌───────────────────────────────┐   │
│   │    EJS Views (SSR Pages)    │◄──────►│    Vue 3 SFCs (.vue Files)    │   │
│   │  home.ejs / room_detail.ejs │        │   Mounted via sfc-loader      │   │
│   └──────────────┬──────────────┘        └──────────────┬────────────────┘   │
│                  │                                      │                    │
│                  ▼                                      ▼                    │
│           Monaco Editor Engine               Vue Reactive Virtual DOM        │
│        (Syntax, Lint, Autocomplete)       (State, Test Runner, AST View)     │
└──────────────────┬──────────────────────────────────────┬────────────────────┘
                   │                                      │
                   │ HTTP / REST / Server-Sent Streams    │
                   ▼                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS EXPRESS SERVER (Port 3000)                        │
│                                                                              │
│   • Dynamic .vue Component Provider (/components/*.vue)                      │
│   • Firebase Cloud Firestore Sync & Authentication Middleware                │
│   • REST Proxy to Go 1.22 Concurrency Engine                                │
│   • Background Process Lifecycle Supervisor                                  │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │ IPC / HTTP Proxy (127.0.0.1:8081)
                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    GOLANG 1.22 ENGINE DAEMON (/bin/go-engine)                │
│                                                                              │
│   ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│   │    pkg/analyzer     │  │     pkg/runner      │  │     pkg/metrics     │  │
│   │   Go AST Parser     │  │ Sandboxed Compiler  │  │ Goroutines & Memory │  │
│   │ Mutex & Race Checks │  │ & Process Executor  │  │  Live Telemetry     │  │
│   └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Capabilities

### 1. VS Code Codespace Environment
- **Monaco Code Editor**: Full syntax highlighting for Go, Vue, Python, JavaScript, JSON, and SQL.
- **File Explorer Sidebar**: Collapsible file tree with file status badges, breadcrumbs, line counts, and encoding indicators.
- **Command Palette (`⌘P` / `Ctrl+P`)**: Quick file switcher and action launcher.
- **Multi-Tab Workspace**: Switch seamlessly between `main.go`, `App.vue`, and script files.
- **Split Panel Views**: Live interactive Virtual DOM output, container execution logs, and Go AST reports.

### 2. Go 1.22 Concurrency Engine (`.go`)
- **Abstract Syntax Tree (AST) Analysis**: Direct AST parsing via Go's native `go/parser` and `go/ast` packages to inspect concurrent goroutine declarations, channel interactions, and mutex synchronization patterns.
- **Sandboxed Execution**: Ephemeral compilation and execution of submitted Go snippets with configurable resource bounds and timeout protection.
- **Live System Telemetry**: Exposes real-time active goroutines count, heap allocation bytes, garbage collection cycles (`NumGC`), and CPU metrics.
- **Concurrency Stress Benchmarking**: Automated concurrent goroutine load tester capable of spawning hundreds of atomic workers simultaneously.

### 3. Vue 3 Single-File Components (`.vue`)
- **Dynamic SFC Loader**: Powered by `vue3-sfc-loader`, allowing `.vue` components to be loaded and mounted directly within `.ejs` server-rendered templates without requiring an intrusive build-step lock-in.
- **`GoEngineStatus.vue`**: Embedded telemetry card displaying real-time engine health, goroutines counters, memory statistics, and an interactive Go AST inspector.
- **`WorkspaceWorkbench.vue`**: Self-contained VS Code-style interactive workbench component with reactive controls, live preview tabs, and sandboxed test execution.
- **`CtfChallengeRunner.vue`**: Reactive security raid testing component with real-time test suite assertion tracking and automated flag unlocking.

### 4. CTF Security Raids
- Audit real vulnerable code patterns across multiple ecosystems:
  - **Raid #1 (Python/SQL)**: Raw String SQL Injection audit and parameterized query fix.
  - **Raid #2 (Node.js)**: Cryptographic timing attacks in token verification.
  - **Raid #3 (Python)**: Pickle insecure deserialization vulnerabilities.
  - **Raid #4 (Node.js)**: JWT `none` algorithm cryptographic authentication bypass.
  - **Raid #5 (Node.js)**: Server-Side Request Forgery (SSRF) in webhook dispatchers.
  - **Raid #6 (Solidity)**: Smart contract reentrancy vulnerability mitigation.
  - **Raid #7 (Golang)**: Goroutine race condition and missing `sync.Mutex` detection.
  - **Raid #8 (Vue 3)**: Reactive unsanitized `v-html` cross-site scripting (XSS) remediation.

---

## Directory Structure

```plaintext
codequest-arena/
├── bin/
│   └── go-engine                       # Compiled Go 1.22 microservice binary
├── components/                         # Vue 3 Single-File Components (.vue)
│   ├── CtfChallengeRunner.vue          # Reactive CTF test runner & flag unlocker
│   ├── GoEngineStatus.vue              # Live Go goroutines & AST telemetry card
│   └── WorkspaceWorkbench.vue          # Interactive VS Code codespace workbench
├── data/
│   └── challenges.js                   # CTF security raid definitions & validators
├── engine/                             # Golang Microservice Engine source
│   ├── go.mod                          # Go module configuration
│   ├── main.go                         # Go HTTP microservice entry point (:8081)
│   └── pkg/
│       ├── analyzer/analyzer.go        # AST-based code analysis & safety score
│       ├── metrics/system.go           # Runtime telemetry (goroutines, heap, GC)
│       └── runner/runner.go            # Sandboxed code execution engine
├── static/
│   ├── css/
│   │   └── custom.css                  # GitHub & VS Code dark theme styling
│   └── js/
│       ├── app.js                      # Core frontend utilities & session helpers
│       ├── firebase-sync.js            # Real-time room synchronization
│       └── vue-loader-helper.js        # Dynamic Vue 3 SFC loader bridge
├── views/                              # Server-side EJS templates
│   ├── pages/
│   │   └── home.ejs                    # Main dashboard & repository explorer
│   ├── partials/
│   │   ├── auth_scripts.ejs            # Google & GitHub OAuth handlers
│   │   ├── footer.ejs                  # Standard footer with status indicators
│   │   ├── header.ejs                  # Asset imports (Vue 3, Codicons, Fonts)
│   │   └── navbar.ejs                  # VS Code / GitHub navigation header
│   ├── projects/
│   │   ├── ctf_challenge_detail.ejs    # Raid briefing & Vue challenge runner
│   │   ├── profile.ejs                 # Player dossier & earned badges
│   │   ├── project_detail.ejs          # Project architecture inspector
│   │   └── project_index.ejs           # Raids catalog with language filters
│   └── workspace/
│       ├── create_room.ejs             # New codespace initialization modal
│       ├── edit_room.ejs               # Room settings & objective editor
│       ├── room_detail.ejs             # VS Code collaborative workbench
│       └── workspace_index.ejs         # Active rooms list & filters
├── firebase-applet-config.json         # Firebase project credentials
├── firebase-blueprint.json             # Firestore database schema definition
├── firestore.rules                     # Cloud Firestore security rules
├── package.json                        # Node.js dependencies & scripts
├── metadata.json                       # AI Studio applet configuration
├── server.js                           # Express application server & Go supervisor
└── README.md                           # Documentation
```

---

## API Endpoints

### Core Application Routes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Main dashboard, repository overview, and Go engine telemetry |
| `GET` | `/projects/` | CTF security raids catalog with language filters (`go`, `vue`, etc.) |
| `GET` | `/projects/challenge/:id` | Challenge briefing, vulnerable code inspection, and test suite |
| `POST` | `/projects/challenge/:id` | Submit and verify CTF flag checksum |
| `GET` | `/projects/profile` | Operative dossier, XP progression, and captured flags |
| `GET` | `/workspace/` | Codespaces hub and room directory |
| `GET` | `/workspace/:id` | Live VS Code collaborative codespace |
| `GET` | `/workspace/rooms/:id/edit` | Edit room objectives and metadata |

### Go 1.22 Microservice API (`/api/go/*`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/go/status` | Microservice heartbeat and Go 1.22 version check |
| `GET` | `/api/go/metrics` | Real-time goroutine count, heap allocation, and GC cycles |
| `POST` | `/api/go/analyze` | Parse code with Go AST parser and verify thread safety |
| `POST` | `/api/go/execute` | Compile and run Go source code inside the sandbox |
| `POST` | `/api/go/stress` | Execute concurrent goroutines benchmark load test |

### Component & Static Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/components/:name.vue` | Serves raw Vue Single-File Components for dynamic SFC loading |
| `GET` | `/vendor/vue/*` | Serves Vue 3 runtime bundle |
| `GET` | `/vendor/vue3-sfc-loader/*`| Serves Vue 3 SFC loader bundle |
| `GET` | `/api/health` | Overall system health check with active language matrix |

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.x or higher (Node 22 recommended)
- **Go**: v1.22.x or higher (installed at `/usr/local/go` or in `$PATH`)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/mhdhamka/CodeQuest.git
cd CodeQuest

# Install Node.js dependencies
npm install

# Build the Go Concurrency Microservice Engine
npm run build
```

### 3. Running the Server
```bash
# Start both the Express server and the Go engine daemon
npm start
```

The application will be accessible at:
- **Web App**: [http://localhost:3000](http://localhost:3000)
- **Go Daemon**: `http://127.0.0.1:8081` (managed automatically by `server.js`)

---

## Development Scripts

| Command | Action |
| :--- | :--- |
| `npm start` | Launches Node.js server and auto-starts the Go daemon |
| `npm run dev` | Development runner with live console logging |
| `npm run build` | Compiles the Go engine binary into `bin/go-engine` |
| `npm run lint` | Runs syntax and type checks on the codebase |

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.


---

Crafted with ⚡ for **CodeQuest Arena** by mhdhamka
