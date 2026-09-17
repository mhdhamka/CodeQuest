<div align="center">

# CodeQuest Arena

**An interactive cyberpunk developer platform featuring RPG progression, real-time collaborative code rooms with Firebase synchronization, and CTF security raid challenges.**

[Live Demo](http://localhost:3000) · [Report Bug](https://github.com/mhdhamka/CodeQuest/issues) · [Request Feature](https://github.com/mhdhamka/CodeQuest/issues)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-22.x-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20Sync-FFCA28?logo=firebase&logoColor=black)
![UI](https://img.shields.io/badge/Theme-Cyberpunk%20Monospace-00f0ff)
![Status](https://img.shields.io/badge/Status-Operational-00ff66)

</div>

---

## Overview

**CodeQuest Arena** is a gamified developer collaboration arena set in a high-contrast cyberpunk environment. Powered by **Node.js**, **Express**, **EJS**, and **Firebase Realtime Database synchronization**, it enables developers to advance RPG avatar classes, co-author code simultaneously in live synchronized workspaces, and conquer CTF-style security raid challenges by auditing and patching vulnerable codebases.

---

## Interactive Workspace Preview

<div align="center">

![Arena Portal Workspace Dashboard](./uploads/images/preview.jpg)

*Real-time synchronized code editor with Firebase listeners, dynamic line numbering, conflict monitors, and shared container execution logs.*

</div>

---

## Key Features

* **🐙 Firebase Authentication with GitHub:** Secure GitHub OAuth sign-in via Firebase Auth linking your personal progress, clearance level, captured CTF raid trophies, and authenticated handle across all synchronized code rooms.
* **⚡ Real-Time Synchronized Code Rooms (Firebase):** Multi-user collaborative code authoring powered by Firebase Realtime listeners (`onSnapshot`) with sub-second synchronization, cursor position preservation, and multi-tab broadcast fallbacks.
* **🛡️ CTF Security Raids & Boss Battles:** Infiltrate challenge zones to inspect vulnerable code patterns (SQL Injection, IDOR, RCE, SSRF, JWT bypass), submit flags, and earn +XP to level up your developer clearance.
* **🎮 RPG Progression & Operative Dossier:** Track your operative level, earned clearance badges, accumulated experience points, and history of captured flags in the Player Dossier backed by Cloud Firestore.
* **🔒 Host Classroom Lock:** Empower room hosts to toggle teacher lock mode, temporarily freezing code buffers across all connected student sessions in real time.
* **☁️ Shared Container Execution Logs:** Execute code in an ephemeral container runtime simulation and automatically broadcast standard output and execution telemetry to all active peers.
* **🎨 Cyberpunk Monospace UI Theme:** High-contrast dark theme (`#06090e`) with Google Fonts (`JetBrains Mono` & `Fira Code`), neon cyan (`#00f0ff`), neon yellow (`#ffe600`), and matrix green accents with responsive HUD navigation.

---

## Tech Stack

* **Runtime & Backend:** Node.js, Express.js (ES Modules)
* **Real-Time Data Layer:** Firebase Realtime Database / Cloud Firestore
* **Templating Engine:** EJS (Embedded JavaScript)
* **Styling & Design:** Custom Cyberpunk CSS, Bootstrap 5, JetBrains Mono & Fira Code typography
* **Sandbox & Telemetry:** Ephemeral container execution logs, WebRTC P2P audio huddle widget

---

## Setup & Installation

Follow the steps below to run CodeQuest Arena on your local machine:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (version 18 or higher) installed on your system.

### 2. Install Dependencies
Clone the repository and install the project dependencies:
```bash
git clone https://github.com/mhdhamka/CodeQuest.git
cd CodeQuest
npm install
```

### 3. Configure Environment
Copy the example environment variables file if needed:
```bash
cp .env.example .env
```
Firebase configuration is managed via `firebase-applet-config.json`.

### 4. Start the Application
Run the production or development server:
```bash
npm start
```
For auto-reloading development mode:
```bash
npm run dev
```

Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)** to launch the CodeQuest Arena terminal!

---

## Project Structure

```plaintext
CodeQuestArena/
├── views/                          # EJS templates and page layouts
│   ├── pages/                      # Main portal / home terminal view
│   ├── partials/                   # Reusable header (with fonts) and footer partials
│   ├── projects/                   # System archives, CTF challenges & player dossier
│   └── workspace/                  # Collaborative code rooms, room creator & editor
├── static/
│   └── css/
│       └── custom.css              # Cyberpunk dark theme, neon borders & animations
├── uploads/
│   └── images/
│       └── preview.jpg             # Arena dashboard preview asset
├── firebase-applet-config.json     # Firebase Realtime & Firestore credentials
├── firebase-blueprint.json         # Database schema blueprint
├── firestore.rules                 # Deployed security rules for room sync
├── server.js                       # Express application server and route definitions
├── package.json                    # Dependencies, scripts, and project metadata
├── metadata.json                   # App capabilities and permissions
└── README.md                       # Project documentation
```

---

## Available Endpoints

| Route | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Main terminal home page & live telemetry feed |
| `/projects/` | `GET` | Archive vault systems & CTF security raid challenges |
| `/projects/project/:id/` | `GET` | Production system architecture inspection |
| `/projects/challenge/:id/` | `GET` / `POST` | Security raid briefing, vulnerable code inspection & flag submission |
| `/projects/profile/` | `GET` | Operative profile dossier, rank, level, and captured flags |
| `/workspace/` | `GET` | Collaborative workspace hub & room search filter |
| `/workspace/room/create/` | `GET` / `POST` | Initialize and configure a new code room |
| `/workspace/room/:id/` | `GET` | Multi-user code editor with real-time Firebase sync |
| `/workspace/rooms/:id/edit/` | `GET` / `POST` | Modify room title, objectives, and tech stack focus |
| `/workspace/room/:id/delete/` | `POST` | Terminate and remove a workspace code room |
| `/api/auth/session` | `POST` | Create or update persistent operative session linked to GitHub profile |
| `/api/auth/logout` | `POST` | Terminate session and restore guest operative clearance |
| `/api/auth/me` | `GET` | Retrieve current authenticated operative profile |
| `/api/firebase-config` | `GET` | Secure client configuration provider |
| `/api/health` | `GET` | Service status health check |

---

### Firebase Authentication (GitHub) Configuration

To link your GitHub accounts with live OAuth authentication:
1. Open the [Firebase Console](https://console.firebase.google.com/) for project `ai-studio-codequest-ec4fb69b-f265-4317-a519-d663784b2c96`.
2. Navigate to **Authentication > Sign-in method > Add provider** and select **GitHub**.
3. In GitHub, go to **Settings > Developer settings > OAuth Apps > New OAuth App**.
4. Set the Authorization Callback URL to:
   ```plaintext
   https://galvanized-strength-bf38q.firebaseapp.com/__/auth/handler
   ```
5. Enter your Client ID and Client Secret into the Firebase Console.
6. Operatives can immediately click **[ SIGN IN WITH GITHUB ]** or link their GitHub handle directly to sync CTF flags and clearances across all sessions!

---

Crafted with ⚡ for **CodeQuest Arena** by mhdhamka
