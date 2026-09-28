# Shadow Tracker v12.0.0 — Zero Idle CPU

## 🚀 What's New

### ⚡ Idle CPU Performance Optimization
Shadow Tracker now consumes near-zero CPU when you're not actively interacting with it. All animations, timers, and Framer Motion loops freeze within 2.5 seconds of the last user input and resume instantly on interaction.

#### Root Causes Fixed (from Chrome DevTools trace analysis)
| Issue | Impact | Fix |
|---|---|---|
| SVG `r:` geometric attribute animation in mascot aura | 403 Layout thrashes per trace window | Replaced with GPU-compositable `transform: scale()` |
| Framer Motion rAF loop running continuously at idle | Continuous animation-frame CPU burn | Frozen via `MotionConfig` `transition={{ duration: 0 }}` when idle |
| ThemeAmbientBackground / SidebarArt / AiNeuralLogo rotating at idle | Persistent GPU usage | Components bail to static renders when `isUserIdle` |
| 1,188 `transitionrun` + `transitionstart` events per 19s idle window | Event listener flood | `transition-duration: 0s` CSS applied globally on idle |
| Wisp quote cycling interval running at idle | Unnecessary timer CPU | Timer early-returns when `isUserIdle()` is true |
| Dashboard TileArt animations running at idle | Multi-layer GPU draws | All 5 TileArt components check `isIdle` before animating |

#### Architecture: Reactive Idle State System
- **`useUserIdle()`** — React hook (subscribes to idle state, triggers re-renders on idle transitions)
- **`isUserIdle()`** — Sync function for use inside timers/intervals without subscription
- **`subscribeUserIdle(fn)`** — Subscribe to idle transitions from outside React
- **Idle timeout**: 2.5 seconds of inactivity (tracks mouse, keyboard, scroll, touch, wheel)
- **CSS killswitch**: `html.is-user-idle` class applied globally — pauses all CSS animations, suppresses all transitions

## 📦 Release Artifacts

| File | Description |
|---|---|
| `shadow-tracker-web-v12.tar.gz` | Static web export (Next.js SPA) |
| `shadow-tracker-docker-v12.tar.gz` | Docker image (nginx-served) |
| `ShadowTracker-v12.apk` | Android APK (Capacitor) |
| `SHA256SUMS.txt` | SHA-256 checksums for all artifacts |

## 🐳 Docker Deployment

```bash
docker pull vibishnathang/shadow-tracker:v12.0.0
docker run -d -p 8081:80 vibishnathang/shadow-tracker:v12.0.0
```

Or with Docker Compose:
```bash
docker compose up -d --build prod
```

## 📱 Android
Install `ShadowTracker-v12.apk` directly on your Android device.

## ✅ Quality Gates
- 77/77 unit tests passing
- Zero TypeScript errors
- Clean Next.js production build
- Docker image HTTP 200 verified

## 🔖 Previous Releases
- [v11.0.0](https://github.com/VibishnathanG/Shadow-Tracker/releases/tag/v11.0.0) — Supplement modal, weight velocity tile, Gym Lab calendar navigation, AI chat multiline, micronutrient intelligence
