# Shadow-Tracker-v1300--UI-Harmonization--Platform-Refinements

## S1-Overview

Shadow Tracker **v13.0.0** introduces end-to-end visual harmonization across every major module, fine-tunes typography scaling and responsive layouts, streamlines biometric management, and delivers native packages for Windows, Android, Docker, and Web.

---

## S2-Whats-New-in-v13

### 🎨 Habit Matrix Sticky Column Theme Harmonization
- Implemented dynamic palette mutation using CSS `color-mix(in srgb, var(--surface) X%, var(--primary) Y%)`.
- Replaced harsh surface contrast with a subtle, theme-reactive shade across sticky habit columns, column headers, and summary rows.
- Dynamic adaptation across all dark and light themes (Midnight, Cyberpunk, Obsidian, White, etc.).
- Preserved sticky horizontal alignment and frictionless fast-scrolling matrix behavior.

### 🔠 Typography Sizing & Relative Scaling Rules
- Sub-font sizes increased across habit matrix items (`text-[10.5px] font-bold text-muted-foreground/90 uppercase`) and biometric tiles without expanding row heights or container boundaries.
- Standardized proportional scaling ensuring auxiliary tags and measurement badges (`ml/day`, units, dates) never exceed parent heading proportions.

### ⚖️ Streamlined Weight Goal, Safety & Biometrics
- Redesigned Biological Sex selector into an equal-width, rounded pill segmented control with dedicated theme-accented states.
- Cleaned up the Weight Goal & Safety edit block: eliminated redundant calculations, trimmed excess vertical whitespace, and removed legacy formula labels.
- Standardized interactive water and supplement inputs with responsive rounded controls.

### 📱 Global Layout Polish & Responsive Refinements
- Reduced top margin padding consistently across all primary views.
- Removed redundant "Privacy First" banner headers to maximize vertical workspace.
- Fixed mobile layout overflows and optimized sidebar icons and header title centering.

---

## S3-Release-Assets

| Asset | Platform | Description | Reference Note |
| :--- | :--- | :--- | :--- |
| `Shadow-Tracker-Release.apk` | Android | Standalone Android mobile package (v2/v3 signed) | |
| `ShadowTracker-v13.apk` | Android | Versioned release APK bundle | |
| `Shadow-Tracker-Portable.exe` | Windows (x64) | Standalone portable executable | |
| `Shadow-Tracker-Setup.exe` | Windows (x64) | Standard NSIS Windows Desktop installer | |
| `shadow-tracker-web-export.tar.gz` | Web | Static SPA bundle ready for web hosting | |
| `shadow-tracker-container.tar.gz` | Docker | Standalone Docker container image archive | |
| `SHA256SUMS.txt` | All | SHA-256 cryptographic integrity checksums | |

---

## S4-Docker-Deployment

```bash
docker pull vibishnathang/shadow-tracker:v13.0.0
docker run -d -p 8081:80 vibishnathang/shadow-tracker:v13.0.0
```

Or run via Docker Compose:
```bash
docker compose up -d --build prod
```

---

## S5-Verification-and-Quality-Gates

- **Vitest Unit Tests**: 77/77 tests passing (100% pass rate)
- **TypeScript**: 0 compiler diagnostics (`tsc --noEmit`)
- **Next.js Production Export**: Clean Turbopack static compilation
- **Docker Image**: Verified healthy HTTP 200 on port 8081

---

[↑ Back to top](#Shadow-Tracker-v1300--UI-Harmonization--Platform-Refinements)
