# Shadow-Tracker-v1600--Universal-Cross-Browser-File-Sync-and-Edge-Background-Stability

## S1-Overview

Shadow Tracker **v16.0.0** introduces a universal cross-browser file synchronization architecture, eliminating browser-specific file access lockouts across Zen, Brave, Firefox, and Safari. This release also resolves background process stability and renderer crash conflicts in Microsoft Edge and WebView2, optimizes DOM transition invalidation, modernizes Nginx caching headers, and prunes legacy build cache overhead.

---

## S2-Whats-New-in-v16

### 🌐 Universal Cross-Browser File Synchronization Engine
- **Universal Browser Support**: Re-architected `oneDriveSync.ts` with a dual-engine adapter pattern.
  - **Direct Disk Handle Mode**: Uses the native File System Access API for silent background file handle writes on Microsoft Edge, Google Chrome, and Tauri Windows desktop.
  - **Universal Fallback Engine**: Implemented seamless HTML5 file selection (`<input type="file">`) and direct downloadable JSON export (`triggerJsonDownload`) for Gecko/WebKit browsers (Zen, Firefox, Brave, Safari) where the File System Access API is blocked or unsupported.
- **Permanent Button Visibility**: Resolved the issue where sync action controls (`Start New Sync File`, `Pick Existing Sync File`, `Sync Now`, `Disconnect`) vanished completely in Zen and Brave. Buttons now remain consistently visible and functional across all browsers.
- **Dynamic Connection Telemetry**: Added responsive status pills to the sync card displaying `DIRECT DISK` or `UNIVERSAL SYNC` alongside live auto-sync telemetry.

### 🛡️ Microsoft Edge Background Stability & Process Crash Elimination
- **Infinite Sync Loop Remediation**: Fixed recursive event loop in `useOneDriveAutoSync.ts` where bidirectional domain sync events (`shadow_health_updated`, `shadow_money_updated`, `shadow_rpg_updated`) triggered endless re-entrant auto-sync cycles every 3 seconds, exhausting renderer memory and crashing Edge when tabs entered Sleeping/Efficiency mode.
- **Audio Renderer Crash Protection**: Guarded `playNotificationChime` in `nativeNotification.ts` against initializing `AudioContext` when `document.hidden` is true, avoiding audio hardware renderer exceptions in background tabs.
- **Notification Permission Guarding**: Removed unprompted `Notification.requestPermission()` calls on initial page mount and from background timer intervals, adhering to modern Chromium background process policies.
- **DOM Transition Optimization**: Replaced universal full-DOM selectors (`html.window-blurred *`, `html.is-user-idle *`) in `globals.css` with targeted element classes, preventing recursive style invalidation storms across thousands of DOM nodes during focus changes.
- **Tauri WebView2 & Windhawk Isolation**: Configured `additionalBrowserArgs` in `tauri.conf.json` (`--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection`) to prevent process hooking collisions and singleton locks when Microsoft Edge runs in parallel.

### ⚡ Caching Modernization & Repository Hygiene
- **Optimized Nginx Cache Headers**: Configured `Cache-Control: no-cache, no-store, must-revalidate` for SPA shell HTML, while preserving immutable 1-year caching for content-hashed Next.js chunks (`/_next/static/`), preventing stale cache traps after updates.
- **Repository Pruning**: Purged 11 obsolete archive tarballs and legacy APK packages from the root directory, reducing the root workspace footprint by over 236 MB.

---

## S3-Release-Assets

| Asset | Platform | Description | Reference Note |
| :--- | :--- | :--- | :--- |
| `Shadow-Tracker-Release.apk` | Android | Standalone Android mobile package (v2/v3 signed) | |
| `ShadowTracker-v16.apk` | Android | Versioned release APK bundle | |
| `Shadow-Tracker-Portable.exe` | Windows (x64) | Standalone portable executable | |
| `Shadow-Tracker-Setup.exe` | Windows (x64) | Standard NSIS Windows Desktop installer | |
| `shadow-tracker-web-export.tar.gz` | Web | Static SPA bundle ready for web hosting | |
| `shadow-tracker-container.tar.gz` | Docker | Standalone Docker container image archive | |
| `SHA256SUMS.txt` | All | SHA-256 cryptographic integrity checksums | |

---

## S4-Docker-Deployment

```bash
docker pull vibishnathang/shadow-tracker:v16.0.0
docker run -d -p 8081:80 vibishnathang/shadow-tracker:v16.0.0
```

Or run via Docker Compose:
```bash
docker compose up -d --build prod
```

---

## S5-Verification-and-Quality-Gates

- **Vitest Unit Tests**: 81/81 tests passing (100% pass rate across 10 test suites)
- **TypeScript**: 0 compiler diagnostics (`tsc --noEmit`)
- **Next.js Production Export**: Clean static compilation (`out/`)
- **Android APK Build**: Signed release assemble via Gradle (`assembleRelease`)
- **Windows Executables**: Tauri x86_64 portable binary and NSIS setup installer
- **Docker Image**: Multi-tagged container image verified on port 8081

---

[↑ Back to top](#Shadow-Tracker-v1600--Universal-Cross-Browser-File-Sync-and-Edge-Background-Stability)
