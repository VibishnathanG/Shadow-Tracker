## Shadow-Tracker-v11-Release

Welcome to **Shadow Tracker v11.0.0**, introducing comprehensive Micronutrient & Vitamin/Mineral intelligence, standalone Supplement management with static modal backgrounds, Dashboard Weight Velocity tracking with goal projection, Gym Lab calendar date jumping, AI Studio multiline keyboard shortcuts, and core rendering stability.

---

### Whats-New-in-v11

#### 🥗 Micronutrient & Vitamin/Mineral Intelligence
- Added comprehensive daily micronutrient breakdown covering essential vitamins (A, C, D3, E, K2, B-complex) and minerals (Zinc, Magnesium, Iron, Calcium, Potassium).
- Automatic daily Recommended Dietary Allowance (RDA) calculation with dynamic deficit alerts and intake completion status badges.
- Clean integration with daily food logs and supplementation.

#### 💊 Standalone Supplement Management
- Redesigned supplement addition into a standalone modal with a fixed, static non-scrollable backdrop.
- Embedded directly within the **Daily Nutrition & Plate** section for unified dietary control.
- Streamlined dosage entries (mg, mcg, IU) with instant profile updates.

#### ⚖️ Biological Habits & Weight Velocity
- Added dedicated **Weight Velocity** tile to the Biological Habits velocity card on the Dashboard.
- Tracks current weight, target goal weight, and delta.
- Provides interactive in-place weight logging when no measurement is recorded for the active day.

#### 🏋️ Gym Lab Calendar Synchronization
- Resolved workout activity "Jump to this date in Gym Lab" navigation bug, ensuring direct calendar date alignment.
- Smooth transition between workout logs and active training schedules.

#### 🤖 AI Assistant Studio Enhancements
- Restored standard multiline keyboard interaction (`Shift + Enter` inserts a newline; `Enter` sends the prompt).
- Standardized search icon styling across AI Prompts and Tools modals for unified visual design.

#### ⚡ Core Engine & Hydration Stability
- Resolved React invariant hook ordering bug during initial client hydration pass.
- Clean Next.js 16 static SPA export with zero TypeScript errors and 100% passing test suite (77 tests).

---

### Release-Assets

| Asset | Platform | Description | Reference Note |
|---|---|---|---|
| `shadow-tracker-v11.apk` | Android | Standalone Android mobile package (v2/v3 signed) | |
| `Shadow-Tracker-Release.apk` | Android | Mirrored release APK in asset bundle | |
| `shadow-tracker-web-v11.tar.gz` | Web | Static SPA bundle ready for static web hosting | |
| `shadow-tracker-docker-v11.tar` | Docker | Docker container image export archive | |
| `SHA256SUMS.txt` | All | SHA-256 cryptographic integrity checksums | |
| `Shadow-Tracker-Portable.exe` | Windows (x64) | Standalone portable executable | |
| `Shadow-Tracker-Setup.exe` | Windows (x64) | Standard NSIS Windows Desktop Installer | |
| `Shadow-Tracker-Windows-Certificate.crt` | Windows | Self-signed certificate for local Windows trust | |
| `WebView2Loader.dll` | Windows | Microsoft Edge WebView2 runtime loader | |

---

[↑ Back to top](#Shadow-Tracker-v11-Release)
