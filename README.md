# Shadow Tracker (Life OS)

> A sovereign, local-first, privacy-first personal operating system and gamified discipline sanctuary. Engineered for elite productivity, health vitality, financial mastery, and mental focus.

---

## Table-of-Contents

- [System-Architecture](#System-Architecture)
- [Application-Lifecycle](#Application-Lifecycle)
- [Life-RPG-and-XP-Internals](#Life-RPG-and-XP-Internals)
  - [XP-Calculation-Formulas](#XP-Calculation-Formulas)
  - [Character-Rank-Progression](#Character-Rank-Progression)
  - [Quest-System-and-Multipliers](#Quest-System-and-Multipliers)
  - [Achievement-Badges-Catalog](#Achievement-Badges-Catalog)
- [Feature-Suite-Deep-Dive](#Feature-Suite-Deep-Dive)
  - [Dashboard-and-Life-OS](#Dashboard-and-Life-OS)
  - [Tasks-Workspace-Grid-and-List](#Tasks-Workspace-Grid-and-List)
  - [Standalone-ToDo-Engine](#Standalone-ToDo-Engine)
  - [Atomic-Habits-Engine](#Atomic-Habits-Engine)
  - [Calendar-and-Time-Blocking](#Calendar-and-Time-Blocking)
  - [Health-and-Vitality-Suite](#Health-and-Vitality-Suite)
  - [Money-and-Financial-Tracker](#Money-and-Financial-Tracker)
  - [Shadow-Wizard-Sanctuary](#Shadow-Wizard-Sanctuary)
  - [Reflections-Journal](#Reflections-Journal)
  - [Analytics-Room](#Analytics-Room)
- [Theme-Ambient-Engine](#Theme-Ambient-Engine)
- [Backup-Restore-and-Cloud-Sync](#Backup-Restore-and-Cloud-Sync)
- [Running-and-Deployment](#Running-and-Deployment)

---

## System-Architecture

Shadow Tracker is built upon a local-first foundation where the user's browser, desktop executable, or mobile application operates as the primary source of truth.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SHADOW TRACKER CLIENT                           │
├──────────────────────────────┬─────────────────────────────────────────┤
│    Presentation Layer        │ Next.js 16 (Turbopack) + React 19       │
│    Styling & Shaders         │ TailwindCSS v4 + Glassy Tokens          │
│    Motion & Kinetics         │ Framer Motion + Canvas Confetti         │
│    State & Reactive Stores   │ Zustand 5 + Reactive Events             │
├──────────────────────────────┼─────────────────────────────────────────┤
│    Local Storage Engines     │ IndexedDB (`shadow_tracker_db`)         │
│                              │ Web Storage (`localStorage` v4)         │
├──────────────────────────────┼─────────────────────────────────────────┤
│    Hardware & Native APIs    │ Web Speech Synthesis (`SpeechSynthesis`)│
│                              │ File System Access API                  │
│                              │ Capacitor 8 (Android Background Alarms) │
│                              │ Tauri 2 (Rust Desktop Shell)            │
├──────────────────────────────┼─────────────────────────────────────────┤
│    Sync Connectors           │ Microsoft OneDrive Auto-Sync            │
│                              │ GitHub Gist Daily Sync                  │
│                              │ Portable JSON Encrypted Backups         │
└──────────────────────────────┴─────────────────────────────────────────┘
```

[↑ Back to contents](#Table-of-Contents)

---

## Application-Lifecycle

The application lifecycle guarantees zero battery drain, zero idle CPU consumption, and resilient offline-first data integrity.

### 1-Boot-and-Hydration
1. **HTML Bootstrap**: Critical layout CSS and theme attributes are read synchronously from `localStorage` to eliminate flashing unstyled content (FOUC).
2. **IndexedDB Initialization**: The database service opens `shadow_tracker_db` (version 2) with transactional object stores:
   - `tasks`
   - `habits`
   - `dailyLogs`
   - `notes`
   - `reminders`
   - `categories`
3. **Zustand Hydration**: Asynchronous load initializes in-memory state. If the store is empty, defaults are seeded gracefully without blocking the UI thread.
4. **Platform Event Listeners**:
   - Page Visibility API listens for `visibilitychange`.
   - Native Tauri IPC listens for `shadow-eco-mode` and tray minimize events.

### 2-Zero-CPU-Idle-Freeze
When Shadow Tracker is minimized, sent to the background tray, or hidden behind another window:
- Framer Motion animation loops (`requestAnimationFrame`) are unmounted immediately.
- Global ambient canvas backgrounds (`ThemeAmbientBackground.tsx`) suspend rendering.
- DOM nodes receive `content-visibility: hidden` to free GPU texture memory and compositing pipelines.
- Transitions and CSS keyframe animations are paused globally via the `.is-hidden` root rule.

### 3-Background-Workers-and-Notifications
- **Capacitor Alarms (Android)**: Exact scheduled triggers invoke `@capacitor/local-notifications` with sticky action buttons (Yes/No completion).
- **Web Worker Timer**: In desktop and web environments, Web Audio API synthesizers play subtle arpeggiated tones upon timer completion without requiring external media assets.

[↑ Back to contents](#Table-of-Contents)

---

## Life-RPG-and-XP-Internals

Shadow Tracker treats personal discipline as a role-playing progression system. Every positive habit, completed task, workout, and logged meal awards Experience Points (XP), leveling up your character from a wandering seeker to an immortal sovereign.

### XP-Calculation-Formulas

$$\text{Next Level XP} = 100 \times \text{Level}^{1.5}$$

Cumulative XP required to reach Level $L$:

$$\text{Total XP}(L) = \sum_{k=1}^{L-1} \left\lfloor 100 \times k^{1.5} \right\rfloor$$

#### Action-XP-Rewards-Table

| Action | XP Awarded | Multiplier Trigger | Reference Note |
|---|---|---|---|
| Complete Standard Task | +25 XP | Priority: High (1.5x), Urgent (2.0x) | |
| Complete Habit Routine | +15 XP | Streak Multiplier: +5% per 5 consecutive days | |
| Hit Daily Nutrition Goal | +30 XP | Perfect macro alignment within 5% | |
| Log Gym Strength Session | +40 XP | Full workout completion | |
| Water Target Achieved (100%) | +20 XP | Daily 8-10 glasses | |
| Morning / Evening Day Review | +20 XP | Per review completed | |
| Commune with 3D Wizard Oracle | +10 XP | Click 3D Sanctuary Avatar | |
| Inscribe Arcane Wisdom Scroll | +15 XP | New custom wisdom inscribed | |
| Epic Quest Milestone | +500 XP | 30-day streak achievement | |

[↑ Back to contents](#Table-of-Contents)

---

### Character-Rank-Progression

Your character's title evolves automatically as you cross XP thresholds:

```
[Level 1-4]   ──► Novice Wanderer
[Level 5-9]   ──► Shadow Initiate
[Level 10-14] ──► Arcane Apprentice
[Level 15-19] ──► Disciplined Adept
[Level 20-29] ──► Void Ranger
[Level 30-39] ──► Master Arcanist
[Level 40-49] ──► Shadow Sovereign
[Level 50+]   ──► Immortal Void Emperor
```

[↑ Back to contents](#Table-of-Contents)

---

### Quest-System-and-Multipliers

Quests are dynamically refreshed and tracked in [LifeRpgFeature.tsx](file:///Main_Workspace/Programming/Python/workspace/shadow-tracker/src/features/rpg/LifeRpgFeature.tsx):

1. **Daily Quests (Refreshed every 24 hours)**:
   - *Deep Work Sprint*: Complete 2+ hours of focused high-priority tasks.
   - *Iron Discipline*: Check off all scheduled physical training routines.
   - *Macro Synchronization*: Log all daily meals and reach within 10% of protein targets.
2. **Epic Quests (Long-Term Mastery)**:
   - *Architect of Dynasty*: Sustain a 30-day streak across core habits.
   - *Financial Sovereign*: Save 30%+ of monthly revenue for 3 consecutive months.
   - *Grand Scholar*: Inscribe and reflect on 25+ wisdom scrolls.

[↑ Back to contents](#Table-of-Contents)

---

### Achievement-Badges-Catalog

Badges are awarded for milestones and persisted in `shadow_unlocked_badges`.

| Badge ID | Badge Title | Criteria | Glow Accent | Reference Note |
|---|---|---|---|---|
| `badge-first-task` | First Blood | Complete your first task | Electric Blue | |
| `badge-first-habit` | Seed of Routine | Establish and log your first habit | Emerald Mint | |
| `badge-streak-3` | Triad Spark | Reach a 3-day consistency streak | Solar Gold | |
| `badge-streak-7` | Week Warrior | Complete 7 consecutive days of execution | Flame Orange | |
| `badge-streak-30` | Unbreakable Will | Maintain a 30-day uninterrupted streak | Royal Amethyst | |
| `badge-streak-90` | Grandmaster | Maintain 90 days of discipline | Radiant Rose | |
| `badge-perfect-day` | Flawless Execution | 100% tasks and habits checked off in a day | Pure Diamond White | |
| `badge-first-note` | Chronicle Inscribed | Author your first reflection note | Cyan Laser | |
| `badge-wealth-master` | Golden Treasury | Achieve a full month financial budget balance | Warm Amber | |
| `badge-vitality-titan` | Iron Temple | Complete 20 structured strength workouts | Crimson Fire | |

[↑ Back to contents](#Table-of-Contents)

---

## Feature-Suite-Deep-Dive

### Dashboard-and-Life-OS
- **Life OS Bar**: 4-column launcher cards for *Start My Day* (Morning Briefing), *Evening Review* (Wins & Reflections), *Health Hub* (Water, Sleep, Nutrition), and *Life RPG* (Character level, quest log).
- **Focus Score Metric**: Real-time calculated score (0-100%) incorporating task completion density, habit consistency, and daily reflections.
- **3D Wizard Oracle Button**: Instant portal launcher in the header providing direct communion with the Sanctuary.

### Tasks-Workspace-Grid-and-List
- **Dual View Modes**:
  - **Grid View**: Multi-column responsive layout displaying rich details, tags, subtasks, and category chips.
  - **List View**: Ultra-compact high-density rows for rapid sorting, editing, and triage.
- **Priority Matrix**: High, Medium, Low priority tags with custom sorting options.
- **Recurring Engine**: Automated recurrence patterns (daily, weekly, custom days).

### Standalone-ToDo-Engine
- Dedicated fast-capture checklist with independent category presets.
- Nested hierarchical subtasks with individual progress bars.
- Schedule selectors with date/time pickers and sound notifications.

### Atomic-Habits-Engine
- Continuous heatmaps displaying 365-day historical consistency.
- Automatic calculation of current streak and all-time longest streak.
- Configurable grace periods to protect streaks during planned rest days.

### Calendar-and-Time-Blocking
- Monthly calendar grid intersected with habit check-offs, task due dates, and journal notes.
- Dedicated **Time-Blocking View** for hourly scheduling and deep focus blocks.

### Health-and-Vitality-Suite
- **Vitality & Nutrition**:
  - Visual plate visualizer tracking Macronutrients (Protein, Carbs, Fats) and total Calories.
  - Water intake tracker with interactive glass counters.
  - Sleep duration and quality gauges.
- **Diet Planner Sub-Tab**:
  - 7-day weekly meal planner with 1-click **Copy to Today's Plate** integration.
  - Custom diet plan creator with automatic BMR and TDEE calorie targets.
  - Extensive built-in Indian and international whole-food nutrition database.
- **Gym & Fitness Tab**:
  - Push/Pull/Legs and Upper/Lower training split logs.
  - Exercise sets, target reps, rest timers, and weight volume tracking.
- **Biometric Feasibility Calculator**:
  - Realistic time-to-goal projections based on calorie deficits and weekly metabolic adaptation.

### Money-and-Financial-Tracker
- **Monthly Budget Map**: Dynamic tracking across 12 full months with income, savings, profits, and expense allocation.
- **Category Distribution**: Shopping, Food, Bills, Subscriptions, and Custom entries.
- **Asset Allocation**: Fixed Big Expenses (Rent, EMI, Insurance), Mutual Funds & Stock investments, and Lent/Borrowed records.

### Shadow-Wizard-Sanctuary
- **3D Interactive Wizard Avatar**:
  - Embedded 3D hooded mascot encased in levitating mana rings.
  - Click-to-commune action: invokes Web Speech API audio recitals, bursts multi-hue stardust confetti, and awards +10 XP.
- **Arcane Grimoire Library**:
  - Filterable by Arcana (Power, Wisdom, Wealth, Tech, Vitality).
  - Inscribe custom wisdom scrolls with persistent local storage.

### Reflections-Journal
- Distraction-free full Markdown editor with live preview.
- Tagging system and historical archives indexed by calendar date.

### Analytics-Room
- Custom SVG focus curves mapping daily focus scores across weeks and months.
- Habit consistency scorecards and weekly radar trends.

[↑ Back to contents](#Table-of-Contents)

---

## Theme-Ambient-Engine

Shadow Tracker features 5 themes with tailored CSS variables, glassy gradient finishes, and GPU-optimized ambient canvas animations:

| Theme ID | Aesthetic Description | Background Canvas | Tile Style | Ambient Animation Concept | Reference Note |
|---|---|---|---|---|---|
| `white` / `light` | Flashy Textured White | `#edf2f7` (Cool Porcelain) | Warm Creamy Linen/Ivory (`#faf7f0`) | **Eternals Gold Runes**: Marvel *Eternals* movie inspired traversing gold filament circuits, rotating sacred mandalas, and floating gold stardust | |
| `purple` / `midnight` | Multi-Color Cosmic Void | `#0b0617` (Deep Celestial Void) | Glassy Dark Purple with Specular Sheen | **Multi-Color Cosmic Rings**: 4-hue concentric orbital rings (amethyst, cyan, gold, rose) with multi-hue stardust | |
| `obsidian` | Pure Pitch Black & Purple | `#07060a` (Obsidian Pitch) | Matte Glassy Black-Purple | **Astronomical Rings & Swords**: Celestial orbital rings with crossed runic swords | |
| `onedark` | Hacker Dark Blue | `#16181d` (Deep Slate) | Frosted Electric Blue Glass | **Orbital Telemetry HUD**: Rotating radar arcs, orbital rings, and pulse beacons | |
| `cyberpunk` | Neon Synthwave Grid | `#10131a` (Dark Matrix) | Cyber Neon Blue/Rose | **Isometric Grid & Cubes**: Wireframe 3D cubes floating over a perspective horizon grid | |

### Eco-Mode-and-Low-GPU-Mode
For battery conservation and ultra-low-spec hardware:
- Toggling Eco Mode switches all ambient backgrounds to **100% static SVGs** (`StaticEternalRings`) with zero Framer Motion loops and 0.0% idle CPU overhead.

[↑ Back to contents](#Table-of-Contents)

---

## Backup-Restore-and-Cloud-Sync

Shadow Tracker guarantees that you own 100% of your data without reliance on proprietary cloud databases.

### 1-Local-JSON-Backup-and-Restore
- **Export**: Generates a unified, timestamped `shadow-tracker-full-backup-YYYY-MM-DD.json` file via the browser's File System Access API (or automatic HTML5 download).
- **Import**: Validates schema integrity, overwrites or merges records, restores all IndexedDB stores and LocalStorage domains (Tasks, Habits, Daily Logs, Notes, Reminders, Categories, Money v4, Health daily logs, Biometrics, Workouts, Diets, Standalone ToDos, Quests, and Badges).
- **Annual Archives**: Archive historical data by year to keep active workspace queries lightning fast.

### 2-Microsoft-OneDrive-Auto-Sync
- Configure a dedicated sync file (e.g. `Documents/shadow-tracker-sync.json`).
- Automatically syncs bidirectionally on data change with a 3-second debouncing safety window.
- Merges remote and local datasets using timestamp reconciliation so no data is lost between devices.

### 3-GitHub-Gist-Daily-Sync
- Secure synchronization using a GitHub Personal Access Token (PAT) with encrypted storage.
- Synchronizes once daily upon launch or manually on demand.

[↑ Back to contents](#Table-of-Contents)

---

## Running-and-Deployment

### Prerequisites
- Node.js 20+ and npm
- Docker (optional, for containerized deployment)

### Development-Mode
```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server with Turbopack
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production-Static-Export-Build
```bash
# Build static export
npm run build

# Static export is generated into the `out/` directory
```

### Running-with-Docker
```bash
# Build Docker image
docker build -t shadow-tracker:latest .

# Run container on port 8081
docker run -d --name tracker -p 8081:80 shadow-tracker:latest

# Verify health endpoint
curl -sI http://localhost:8081/health
```

### Desktop-Executable-Build-Tauri-2
```bash
# Build Windows portable single executable and setup installer
npm run build:tauri
```
Generated binaries:
- `release/Shadow-Tracker-Setup.exe` (NSIS Installer)
- `release/Shadow-Tracker-Portable.exe` (Standalone Portable)

### Mobile-Android-Build-Capacitor-8
```bash
# Sync web export to Android Capacitor project
npx cap sync android

# Open in Android Studio or build release APK via Gradle
cd android && ./gradlew assembleRelease
```
Generated binary:
- `release/Shadow-Tracker-Release.apk`

---

## Verification-Checklist

| System Component | Verification Status | Reference Note |
|---|---|---|
| Health Suite Diet Planner Sub-Tab | Verified (Sub-tab toggle inside Health feature) | |
| Multi-Color Cosmic Purple Theme | Verified (Deep void canvas `#0b0617`, multi-color domain accents) | |
| White Theme Creamy Ivory Tiles | Verified (Linen tiles, distinct warm borders, Eternals gold runes) | |
| 3D Wizard Logo & Companion Interactivity | Verified (Sidebar logo, mobile header, Dashboard launcher, Sanctuary communion) | |
| Glassy Gradient & Non-Harsh Borders | Verified (Universal `.tile`, `.glossy-tile`, `.btn-glass`, `.badge-glass`) | |
| Backup, Restore & Demo Dataset | Verified (100% roundtrip test passed across all modern features) | |
| Bidirectional Sync Reconciliation | Verified (`mergeBackupDatasets` covers all state domains) | |
| Zero-CPU Idle Engine | Verified (Visibility API and Eco Mode static SVG fallback) | |
| Next.js Static Export & Docker Deploy | Verified (Healthy on `http://localhost:8081`) | |

---

## License

Proprietary sovereign personal OS. Built with passion for discipline, focus, and clarity.
