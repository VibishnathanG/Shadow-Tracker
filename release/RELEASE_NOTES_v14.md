# Shadow-Tracker-v1400--Health-Intelligence-Bio-Overview--Theme-Refinements

## S1-Overview

Shadow Tracker **v14.0.0** expands comprehensive health analytics across the dashboard calendar, streamlines daily weight input validation and energy check-in ergonomics, optimizes mobile responsiveness for training routines and nutrition actions, and introduces dark-grey theme overrides for the habit matrix sidebar under Obsidian, Cyberpunk, and Spectrum themes.

---

## S2-Whats-New-in-v14

### ⚖️ Streamlined Weight Logging & Strict Boundary Guards
- Migrated weight logging from Biological Habits Velocity into the Energy Check-in card.
- Biological Habits Velocity now features a clean, read-only status and progress delta display without bulky input forms.
- Enforced strict numerical limits on weight input:
  - Range: `10 – 150 kg` (and `22 – 330 lbs`).
  - Blocks typing numbers exceeding limits, clamps bounds on blur, and prevents negative or exponential inputs.
- Compacted the Energy Check-in card to match the vertical profile and height of Sleep & Recovery.

### 📅 Calendar Selected Day Health & Nutrition Companion Drawer
- When any day is clicked on the Exercise & Workout Activity Calendar, a companion **Health, Sleep & Nutrition Overview** drawer now appears alongside workout activity.
- Covers the core 4 biometric pillars for that specific date:
  - **Hydration**: Volume consumed vs daily goal with visual gradient progress bar.
  - **Sleep**: Tracked sleep duration vs goal with subjective sleep quality badges.
  - **Weight**: Logged bodyweight with delta relative to target weight goal.
  - **Calorie Intake vs Limit**: Cumulative calorie consumption from logged meals against configured daily limits.
- **Macronutrients Split**: Immediate breakdown of Protein, Carbs, and Fats in grams.
- **Vitamins & Minerals RDA**: Real-time calculation of overall daily micronutrient RDA percentage met.
- **Direct Navigation**: 1-click jump button directly to the Nutrition Plate for that date.

### 🏋️ Mobile Responsiveness & Routine Selector
- Fixed mobile clipping and horizontal overflow in the Workout Routine Selector dropdown (`w-full sm:w-auto max-w-full truncate`).
- Guaranteed single-line display for `+ Add Supplement` and `+ Add Food to Plate` buttons on mobile screens via `flex-nowrap` and optimized touch padding.
- Removed cluttered enclosing containers on Vitamins & Minerals Profile preset buttons, replacing them with a sleek, un-enclosed one-liner bar for Sex and Age group selections.

### 🎨 Habit Matrix Sticky Sidebar Dark Grey Theme Overrides
- Replaced the saturated/purple tint with a black-shaded dark grey (`#121316` / `#16181d`, hover `#1c1e24`) specifically for **Obsidian**, **Cyberpunk**, and **Spectrum** themes.
- Maintains harmonious color-mixed primary tints for all other standard themes.

---

## S3-Release-Assets

| Asset | Platform | Description | Reference Note |
| :--- | :--- | :--- | :--- |
| `Shadow-Tracker-Release.apk` | Android | Standalone Android mobile package (v2/v3 signed) | |
| `ShadowTracker-v14.apk` | Android | Versioned release APK bundle | |
| `Shadow-Tracker-Portable.exe` | Windows (x64) | Standalone portable executable | |
| `Shadow-Tracker-Setup.exe` | Windows (x64) | Standard NSIS Windows Desktop installer | |
| `shadow-tracker-web-export.tar.gz` | Web | Static SPA bundle ready for web hosting | |
| `shadow-tracker-container.tar.gz` | Docker | Standalone Docker container image archive | |
| `SHA256SUMS.txt` | All | SHA-256 cryptographic integrity checksums | |

---

## S4-Docker-Deployment

```bash
docker pull vibishnathang/shadow-tracker:v14.0.0
docker run -d -p 8081:80 vibishnathang/shadow-tracker:v14.0.0
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

[↑ Back to top](#Shadow-Tracker-v1400--Health-Intelligence-Bio-Overview--Theme-Refinements)
