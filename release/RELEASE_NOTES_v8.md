## 🌌 Shadow Tracker v8 Stable Release

Welcome to **Shadow Tracker v8**, bringing visual polish, refined Obsidian and Cyberpunk palettes, zero-overhead Framer Motion optimizations, and clean multi-platform binaries.

---

### 🚀 What's New in v8

#### 🎨 Obsidian Theme Redesign
- Redesigned Obsidian theme featuring a deep dark void canvas (`#0c0a10`), crisp soft white typography (`#ffffff` / `#f1f5f9`), and glowing warm orange secondary accents (`#f97316`) balanced with regal purple.
- Balanced font sizes, muted borders, and glassy gradient containers for comfortable readability.

#### 🌆 Softened Cyberpunk Theme
- Replaced harsh neon red accents with muted coral-rose (`#c95d6e` / `#e56b7c`) across all cyberpunk tiles, glowing borders, and action buttons to eliminate eye fatigue.

#### 📅 Streamlined Calendar Moods & Clean UI
- Simplified the Calendar Daily Mood Rating to clean emojis alone without text wording.
- Removed sovereignty taglines and context ceiling clutter from the AI Assistant modal.
- Compacted the To-Do feature and modals by stripping redundant inline date/reminder pills.

#### ⚡ Performance & Idle CPU Engine
- Fixed Framer Motion property recalculations in anime companion greetings, maintaining near-zero CPU and GPU overhead during idle states.
- Optimized Next.js 16 production export with Turbopack.

---

### 📦 Release Assets & Verification

| Asset | Platform | Description | Reference Note |
|---|---|---|---|
| `Shadow-Tracker-Portable.exe` | Windows (x64) | Standalone portable executable (No installation required) | |
| `Shadow-Tracker-Setup.exe` | Windows (x64) | Standard NSIS Windows Desktop Installer | |
| `Shadow-Tracker-Release.apk` | Android | Standalone Android mobile package (v2/v3 signed) | |
| `shadow-tracker-web-export.tar.gz` | Web | Static SPA bundle ready for any static web host | |
| `shadow-tracker-container.tar.gz` | Docker | Docker container image export archive | |
| `SHA256SUMS.txt` | All | SHA-256 cryptographic integrity hashes | |
| `Shadow-Tracker-Windows-Certificate.crt` | Windows | Self-signed certificate for local Windows trust | |
| `WebView2Loader.dll` | Windows | Microsoft Edge WebView2 runtime loader | |

---

### 🐳 Docker Hub Deployment
Pull and run the official v8 container directly:
```bash
# Pull v8 or latest
docker pull vibishnathang/shadow-tracker:v8
docker pull vibishnathang/shadow-tracker:latest

# Run container
docker run -d -p 8081:80 --name shadow-tracker-v8 vibishnathang/shadow-tracker:v8
```

---

### 🔐 SHA256 Checksums
```
3a8fd9ce07e09ff2bcef1578bf640c3dfd049e1d8b193da4bf06650a4bb88b10  Shadow-Tracker-Portable.exe
785789b1f9c9dac80abbe8d3d85948706f6ae159daf7a758100ff03c9efaa295  Shadow-Tracker-Setup.exe
04c5526ee77d8a48f07f9067005a2c0a9f8c0f4ea0596cae4aae30d5688b8334  Shadow-Tracker-Release.apk
7665a4d86f902386cef1af88dee3290cbac822a46d59b49d2d411816c21bbc87  shadow-tracker-web-export.tar.gz
03b11af97a534cc92372c698620e4a8ac708c9e1c1a2ea21925cae94c5027b44  shadow-tracker-container.tar.gz
```
