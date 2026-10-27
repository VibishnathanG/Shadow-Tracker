# Shadow-Tracker-v1700--Streak--GymMane-Integrations-Animation-Endurance--Decluttered-HUD

## S1-Overview

Shadow Tracker **v17.0.0** delivers third-party mobile ecosystem integrations for Streak and GymMane backups, non-destructive smart append data ingestion, one-way automatic timestamp sync, extended ambient animation endurance with hardware-accelerated compositor isolation, full-spectrum UI decluttering across HUD panels and badges, White Theme Achievement Nexus milestone glow harmony, and rounded input fields in Settings.

---

## S2-Whats-New-in-v17

### 📱 Streak & GymMane Mobile Backup Integrations
- **Streak Mobile Backup Ingestion**: Added native support for importing tasks and habit streaks from Streak mobile backups (`DD-MM-YYYY` format, nested task checklists, priority mappings, and habit frequencies).
- **GymMane Health Telemetry Ingestion**: Added JSON backup parser for GymMane, extracting water hydration logs, meal food entries, and supplement nutrition history into Shadow Tracker's health engine.
- **Resilient Mobile Zip Extractor**: Engineered a specialized deflate stream extractor (`zipExtractor.ts`) using raw inflation headers to reliably decompress Dart/Flutter mobile archive formats without sizing mismatch failures.
- **Non-Destructive Append Logic**: Ensured imported third-party telemetry safely appends onto existing local-first records without overwriting historical user activity.
- **Dedicated Settings Integration Tile**: Integrated an intuitive multi-app backup selection tile directly inside Display & Interface Settings.
- **Automatic Silent Sync Toggle**: Added background one-way file synchronization with timestamp checking, automatically updating existing tasks and habits gracefully without invasive full-download dialog popups.
- **Extensible Integration Architecture**: Documented third-party export and parser specifications in `README.md` for seamless future app additions.

### 🌟 Ambient Animation Endurance & Performance
- **Extended Inactivity Timeout**: Increased background animation idle threshold to 30 minutes (`1,800,000 ms`), keeping cosmic, orbital HUD, and rune background animations fluid during continuous reading and workflow sessions.
- **GPU Compositor Containment**: Promoted `.theme-ambient-canvas` to an isolated GPU compositor layer (`transform: translateZ(0)`, `contain: strict`, `will-change: transform`), preventing SVG geometry animation cycles from triggering layout reflows or CPU spikes.

### 🎨 HUD Decluttering & Refined Styling
- **Achievement Nexus Milestone Glow Harmony (White Theme)**:
  - All 10 milestone badges now share solid pastel 100-shade fills (`#cffafe` cyan, `#e0e7ff` indigo, `#fef3c7` amber, `#d1fae5` emerald, `#ffedd5` orange, `#fef9c3` yellow, `#f3e8ff` purple, `#fae8ff` fuchsia, `#fce7f3` pink, `#ccfbf1` teal).
  - Each milestone emits its own vibrant colored glow and inner border matching its unique theme ink.
  - Deep high-contrast typography (`!text-slate-950 font-black` title and `!text-slate-800 font-bold` subtitle) ensures maximum readability.
- **ToDo Page Refinements**:
  - Unified micro-progress bar (`0%`) and metrics counters (`Total`, `Active`, `Done`, `Starred`) in a neat, clean rounded capsule enclosure.
  - Added smooth rounded corners (`!rounded-xl`) and subtle border styling to the `Add a ToDo...` input box.
  - Converted task list priority badges (`🔥 High`, `⚡ Med`, `☕ Low`), due dates, alarms, and recurrence indicators to clean, borderless colored pills.
- **Command Centre / Habit Matrix**:
  - Re-engineered `Full Month | Week View`, lock-in window (`3d`), and the month navigation capsule into a unified, sleek, compact rounded control bar.
  - Added `.clean-select` styling eliminating rogue white box artifacts on the grace period selector.
- **Journal Reflection**: Removed enclosing border outline from the `Reading View | Raw Editor` segmented capsule.
- **Wealth Page**: Cleared the outline box around the month switcher capsule (`< OCT 2026 >`).
- **Life RPG**: Removed the outer outline box on the Level Progress and `Roadmap (1-100)` card.
- **Settings Rounded Entry Boxes**: Styled `OPERATOR ALIAS`, `SAVINGS TARGET`, and `INVESTMENTS TARGET` with smooth, modern rounded entry boxes (`!rounded-2xl px-4 py-2.5`).

---

## S3-Release-Assets

| Asset | Platform | Description | Reference Note |
| :--- | :--- | :--- | :--- |
| `Shadow-Tracker-Release.apk` | Android | Standalone Android mobile package (v2/v3 signed) | |
| `ShadowTracker-v17.apk` | Android | Versioned release APK bundle | |
| `Shadow-Tracker-Portable.exe` | Windows (x64) | Standalone portable executable | |
| `Shadow-Tracker-Setup.exe` | Windows (x64) | Standard NSIS Windows Desktop installer | |
| `shadow-tracker-web-export.tar.gz` | Web | Static SPA bundle ready for web hosting | |
| `shadow-tracker-container.tar.gz` | Docker | Standalone Docker container image archive | |
| `SHA256SUMS.txt` | All | SHA-256 cryptographic integrity checksums | |

---

## S4-Docker-Deployment

```bash
docker pull vibishnathang/shadow-tracker:v17.0.0
docker run -d -p 8081:80 vibishnathang/shadow-tracker:v17.0.0
```

Or run via Docker Compose:
```bash
docker compose up -d --build prod
```

---

## S5-Verification-and-Quality-Gates

- **Vitest Unit Tests**: 171/171 tests passing (100% pass rate across 22 test suites)
- **TypeScript**: 0 compiler diagnostics (`tsc --noEmit`)
- **Next.js Production Export**: Clean static compilation (`out/`)
- **Android APK Build**: Signed release assemble via Gradle (`assembleRelease`)
- **Windows Executables**: Tauri x86_64 portable binary and NSIS setup installer
- **Docker Image**: Multi-tagged container image verified on port 8081

---

[↑ Back to top](#Shadow-Tracker-v1700--Streak--GymMane-Integrations-Animation-Endurance--Decluttered-HUD)
