# Shadow-Tracker-v1500--Dashboard-HUD-Overflow-Fix-and-Responsiveness-Refinements

## S1-Overview

Shadow Tracker **v15.0.0** delivers targeted UI responsiveness enhancements resolving card clipping and element overflow across the Dashboard HUD, achievement nexus, timeline nodes, and quick action controls.

---

## S2-Whats-New-in-v15

### 🎯 Dashboard HUD "Today's Objective" Overflow Elimination
- Fixed clipping of `{completedPercent}% completed` in the 4-column HUD row (`lg:grid-cols-4`) on constrained window and laptop resolutions.
- Implemented responsive badge styling:
  - Concise `{completedPercent}%` display on narrow/compact viewports (`< sm` and `lg` to `< 2xl`) guaranteeing zero overflow.
  - Full `{completedPercent}% completed` on wide viewports (`sm` to `< lg`, and `>= 2xl`).
- Enhanced header flex layout with `min-w-0` and truncation protection on the title to guarantee flex items never push outside `.tile` borders.
- Added word-break safety (`min-w-0 break-words`) to the coaching motivation recommendation text.

### ⚡ Dashboard HUD Analytics Snapshot & Quick Actions Polish
- Added truncation protection and `shrink-0` to the Analytics Snapshot title and icon to prevent header collisions.
- Refined Quick Action button padding and typography (`p-2 sm:p-2.5`, `text-xs sm:text-sm`) ensuring "New Task", "Habit", "Journal", and "Stats" fit cleanly across all column widths.
- Fixed Timeline header resolved count badge with responsive wording ("resolved" vs "nodes resolved") and added truncation safety to bottom Flow State indicator.
- Updated Health Hub top badge breakpoint to standard `sm:inline` ensuring optimal visibility across themes.

---

## S3-Release-Assets

| Asset | Platform | Description | Reference Note |
| :--- | :--- | :--- | :--- |
| `Shadow-Tracker-Release.apk` | Android | Standalone Android mobile package (v2/v3 signed) | |
| `ShadowTracker-v15.apk` | Android | Versioned release APK bundle | |
| `Shadow-Tracker-Portable.exe` | Windows (x64) | Standalone portable executable | |
| `Shadow-Tracker-Setup.exe` | Windows (x64) | Standard NSIS Windows Desktop installer | |
| `shadow-tracker-web-export.tar.gz` | Web | Static SPA bundle ready for web hosting | |
| `shadow-tracker-container.tar.gz` | Docker | Standalone Docker container image archive | |
| `SHA256SUMS.txt` | All | SHA-256 cryptographic integrity checksums | |

---

## S4-Docker-Deployment

```bash
docker pull vibishnathang/shadow-tracker:v15.0.0
docker run -d -p 8081:80 vibishnathang/shadow-tracker:v15.0.0
```

Or run via Docker Compose:
```bash
docker compose up -d --build prod
```

---

## S5-Verification-and-Quality-Gates

- **Vitest Unit Tests**: 77/77 tests passing (100% pass rate)
- **TypeScript**: 0 compiler diagnostics (`tsc --noEmit`)
- **Next.js Production Export**: Clean static compilation (`out/`)
- **Android APK Build**: Clean gradle release assemble with signed bundle
- **Windows Executables**: Tauri x86_64 portable binary and NSIS setup installer
- **Docker Image**: Multi-tagged container image verified

---

[↑ Back to top](#Shadow-Tracker-v1500--Dashboard-HUD-Overflow-Fix-and-Responsiveness-Refinements)
