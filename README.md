# Shadow-Tracker-Life-OS

<p align="center">
  <img src="./public/app_logo_master.png" alt="Shadow Tracker Logo" width="100" />
</p>

<h3 align="center">Local-First • Privacy-First • Personal Operating System</h3>

<p align="center">
  <a href="https://hub.docker.com/r/vibishnathang/shadow-tracker"><img src="https://img.shields.io/docker/pulls/vibishnathang/shadow-tracker?style=flat-square&logo=docker&label=Docker%20Pulls&color=0db7ed" alt="Docker Pulls" /></a>
  <a href="https://hub.docker.com/r/vibishnathang/shadow-tracker"><img src="https://img.shields.io/docker/v/vibishnathang/shadow-tracker?sort=semver&style=flat-square&logo=docker&label=Docker%20Hub&color=blue" alt="Docker Hub Version" /></a>
  <a href="https://github.com/VibishnathanG/Shadow-Tracker/releases"><img src="https://img.shields.io/badge/Release-v6.0.0-emerald?style=flat-square&logo=github" alt="Release v6.0.0" /></a>
  <img src="https://img.shields.io/badge/Platforms-Web%20%7C%20Docker%20%7C%20Android%20%7C%20Windows-blue?style=flat-square" alt="Supported Platforms" />
  <img src="https://img.shields.io/badge/License-GPL--3.0-purple?style=flat-square" alt="License: GPL-3.0" />
</p>

---

## App-Walkthrough-Video

Watch a 3-minute complete tour of Shadow Tracker in action:

<p align="center">
  <a href="https://github.com/VibishnathanG/Shadow-Tracker/raw/main/public/app-looks/Shadow-Tracker-Look.mp4" title="Watch full 3-minute walkthrough video">
    <img src="./public/app-looks/demo-preview.gif" alt="Shadow Tracker Live Walkthrough Preview" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/VibishnathanG/Shadow-Tracker/raw/main/public/app-looks/Shadow-Tracker-Look.mp4">
    <img src="https://img.shields.io/badge/▶%EF%B8%8F_Watch_Full_Tour_(3_Mins)-Direct_Stream-10b981?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch Full Video" />
  </a>
  <a href="https://github.com/VibishnathanG/Shadow-Tracker/releases/download/v6.0.0/Shadow-Tracker-Look.mp4">
    <img src="https://img.shields.io/badge/📥_Download_Video_(82MB)-Release_Asset-6366f1?style=for-the-badge" alt="Download Video" />
  </a>
</p>

---

## Project-Overview

**Shadow Tracker** is an offline-first personal dashboard designed to track habits, tasks, health, and finances while turning your daily consistency into an RPG progression system.

All your records stay on your own machine. Data is stored directly in your browser's IndexedDB and LocalStorage — there are no mandatory accounts, no third-party tracking, and no external database dependencies.

---

## Core-Features

- **Habit Matrix & Streaks**: Daily habit tracking with 15-week consistency heatmaps, custom recurring schedules, and streak shields.
- **Tasks & Standalone ToDos**: Priority matrix, time-boxing, subtasks, and an instant-access checklist for quick errands.
- **Health & Nutrition**: Hydration logging with target goals, calorie tracking, macro distribution (Protein, Carbs, Fats), and workout logs.
- **Wealth & Budgeting**: Expense logging, subscription trackers, category envelopes, and monthly savings allocation charts.
- **Life RPG Engine**: Earn XP for completing daily actions, level up your character rank, and unlock achievement badges.
- **Ambient Focus Companions**: Smooth, lightweight animations (maglev train, shadow ninja, cyber dragon, hoverboard) that automatically turn off in Eco Mode to preserve laptop battery.
- **Encrypted Backups**: Export and import your data anytime with signed SHA-256 envelopes or AES-GCM encrypted backup bundles.

---

## Shadow-AI-Copilot

Shadow Tracker includes a private autonomous AI assistant that helps manage your daily life without sending your data to any cloud service unless you ask it to.

- **16 Local Tools**: The AI can create tasks, complete habits, plan diet meals, log hydration, configure reminders/alarms, and update budgets. All operations are safe and strictly non-destructive (no delete tools).
- **Session-Only Privacy**: Your API key is stored in browser memory only (`sessionStorage`) and disappears the moment you close the tab or click Discard.
- **Custom Context Window**: You choose how much tracker history the AI sees — from the last 7 days up to 1 year of data.
- **Works with Local LLMs**: Connect to any OpenAI-compatible API or run 100% offline with local models through Ollama or LM Studio on `http://localhost:11434/v1`.
- **Custom Tools & Prompt Library**: 18+ pre-configured day-to-day productivity prompts, real-time prompt search, and the ability to define your own tools using JSON Schema.
- **Live Markdown & Table Support**: Responses format clean bullet points, bold text, code blocks, and markdown tables automatically.

---

## Performance-Benchmarks

Measured in live production tests on the official Docker image serving high-concurrency requests and large-volume client data:

| Metric | Result | Context / Notes |
|---|---|---|
| **Server Throughput** | **~7,450 req/sec** | Nginx event-driven static asset caching |
| **Average Response Latency** | **7.8 ms** (p50: 5.9 ms) | Sub-10ms response times under load |
| **Container Memory (Idle)** | **10.8 MiB RAM** | Lightweight container footprint |
| **Container Memory (Peak Load)** | **11.5 MiB RAM** | +0.7 MiB under 3,000 concurrent requests |
| **Container CPU** | **< 2%** | Negligible CPU footprint on host |
| **15k Records Parsing & Hydration** | **12.1 ms** | Fast IndexedDB & JSON deserialization |
| **Full 1-Year AI Snapshot** | **~9,000 tokens** | Fits easily inside 16k/32k/64k token ceilings |

---

## Quick-Start-and-Docker

Run Shadow Tracker in seconds using Docker:

```bash
docker run -d \
  --name shadow-tracker \
  --restart unless-stopped \
  -p 8081:80 \
  vibishnathang/shadow-tracker:latest
```

Open [http://localhost:8081](http://localhost:8081) in your browser.

Or use Docker Compose:

```yaml
services:
  shadow-tracker:
    image: vibishnathang/shadow-tracker:latest
    container_name: shadow-tracker-prod
    restart: unless-stopped
    ports:
      - "8081:80"
```

```bash
docker compose up -d
```

---

## Running-from-Source

```bash
# Clone the repository
git clone https://github.com/VibishnathanG/Shadow-Tracker.git
cd Shadow-Tracker

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To build the production static export:

```bash
npm run build
```

---

## Multi-Platform-Builds

- **Windows Desktop**: Build native installers and portable executables using Tauri:
  ```bash
  npm run build:tauri
  ```
- **Android Mobile**: Build release APK using Capacitor:
  ```bash
  npx cap sync android
  cd android && ./gradlew assembleRelease
  ```

---

## License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**. See the [LICENSE](./LICENSE) file for details.
