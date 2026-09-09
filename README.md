# shadow-tracker

A premium, privacy-first, local-first productivity tracker for daily tasks, streaks, analytics, and mindful journaling.

---

## 🌌 Product Vision

`shadow-tracker` is a consumer-grade personal dashboard designed to foster daily discipline. The interface features a glowing, cyberpunk-inspired layout built on core web performance rules. 

### Core Principles
1. **Privacy-First**: No tracking cookies, logins, or server syncs by default. Your data is strictly yours.
2. **Local-First**: All tasks, logs, and reflections are saved locally in your browser's sandboxed IndexedDB database.
3. **Gamified Consistency**: Earn progress milestones and track your peak output through a dynamic Focus Score.

---

## 🛠️ Feature Directory

* **Today Portal (Dashboard)**: Visual focus score gauges, today's routines checklist, upcoming reminders, and weekly consistency rings.
* **Tasks Workspace**: Tabbed categories (Pending, Completed, All), custom priority indicators, snooze actions (+1 day to due date), and recurring routines.
* **Atomic Habits**: Completion heatmaps, active streak counters (`🔥`), historical records, and customizable schedules (daily, weekly, or specific custom weekdays).
* **Calendar Agenda**: Intersected monthly calendar grids. Clicking a day loads historical check-offs, focus scores, mood logs, and your journal reflection notes.
* **Reflections Journal**: Full Markdown text editor with search and browse logs.
* **Analytics Room**: Consistency scorecard alongside an custom-crafted SVG focus timeline chart.
* **Command Bar**: Global keyboard-driven search overlay (`Cmd+K` / `Ctrl+K`) for rapid task creation, theme toggling, and page navigation.
* **Control Console (Settings)**: Layout switches, custom category color-badge editors, database resets, and local database backup exports/imports (JSON).

---

## 🚀 Getting Started

### Local Setup
1. Clone the project.
2. Install npm dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Run the development hot-reloaded server:
   ```bash
   npm run dev
   ```
4. Access the portal at [http://localhost:3000](http://localhost:3000).

### Unit Testing
We use `Vitest` to test our streak logic, calendar grids, and date utility rules:
```bash
npm run test
```

### Production Build
To test compilation performance:
```bash
npm run build
npm run start
```

---

## 🐳 Docker Deployment

The application is containerized with multi-stage Dockerfiles, optimizing image size (using Next.js standalone outputs) and disabling analytics collection.

### Development Container (Hot Reloading)
```bash
docker compose up dev
```
*Your local directory is volume-mounted. Edits will hot-reload dynamically.*

### Production Build & Serve
```bash
docker compose up prod --build
```
*Binds port `8080` on your host machine to port `3000` inside the container. Accessible at `http://localhost:8080`.*

---

## ⌨️ Command Bar Keyboard Shortcuts

| Shortcut | Command / Action |
| :--- | :--- |
| `Cmd+K` or `Ctrl+K` | Open / Close Quick Command Bar |
| `↑` / `↓` | Navigate Command list |
| `Enter` | Select and execute Command |
| `Esc` | Dismiss / Close modal |
| *Type text + Enter* | Quick Add Task / Habit |

---

## 📦 Production Builds & Deployment Artifacts

`shadow-tracker` is engineered for cross-platform deployment across Web, Desktop, and Mobile:

- **⚡ Tauri Windows Setup Installer**: [`shadow-tracker-tauri-setup.exe`](./shadow-tracker-tauri-setup.exe) *(6.0 MB — Ultra-lightweight installer powered by Rust & Windows Native WebView2, ~15MB RAM, instant launch)*
- **💻 Tauri Windows Standalone**: [`shadow-tracker-tauri-windows.exe`](./shadow-tracker-tauri-windows.exe) *(23 MB — Portable single executable)*
- **📱 Release Android APK**: [`shadow-tracker-signed.apk`](./shadow-tracker-signed.apk) *(5.3 MB — Verified & Signed Release APK with pre-scheduled background alarms and sticky YES/NO notification actions)*
- **🐳 Docker Container**: `shadow-tracker:latest` *(Multi-stage Alpine Nginx container serving static export on port 8080)*
