## 🌌 Shadow Tracker v7 Stable Release

Welcome to **Shadow Tracker v7**, the next major milestone delivering enhanced visual hierarchy, optimized layout density, and clean unified binaries across all supported platforms.

---

### 🚀 What's New in v7

#### 🎨 Distinguishable Themed Item Titles
- Implemented dedicated item title styling for **Tasks**, **Habits**, and **To-Dos** that subtly stands out from body copy across all dark and colored themes (Cyberpunk, AMOLED, Forest, Crimson, Purple, Ocean).
- Preserved pristine ink-black contrast for the clean White / Light theme.

#### 🔍 Streamlined To-Do Filter Bar
- Compacted the search query input, priority dropdown, and sorting selector into a unified, single responsive toolbar.
- Eliminates vertical wasted space and enhances mobile / desktop density.

#### 🏷️ Clean 2-Row Task Badges
- Standardized grid view badge layout into two neat rows:
  - **Row 1**: Shadow Category (left) + Subcategory (right)
  - **Row 2**: To-Do Count (left) + Priority Indicator (right)

#### 🧭 Habit Routine Category Visibility
- Integrated smooth hover expansion and tooltip reveal for routine categories, ensuring complete label visibility without truncating long routine names.

#### ⚡ Performance & Optimization
- Minimized background animations and idle CPU/GPU consumption.
- Clean Next.js 16 production export with Turbopack optimizations.

---

### 📦 Release Assets & Verification

| Asset | Platform | Description |
|---|---|---|
| `Shadow-Tracker-Portable.exe` | Windows (x64) | Standalone portable executable (No installation required) |
| `Shadow-Tracker-Setup.exe` | Windows (x64) | Standard NSIS Windows Desktop Installer |
| `Shadow-Tracker-Release.apk` | Android | Standalone Android mobile package |
| `shadow-tracker-web-export.tar.gz` | Web | Static SPA bundle ready for any static web host |
| `shadow-tracker-container.tar.gz` | Docker | Docker container image export archive |
| `SHA256SUMS.txt` | All | SHA-256 cryptographic integrity hashes |
| `Shadow-Tracker-Windows-Certificate.crt` | Windows | Self-signed certificate for local Windows trust |

---

### 🐳 Docker Hub Deployment
Pull and run the official v7 container directly:
```bash
# Pull v7 or latest
docker pull vibishnathang/shadow-tracker:v7
docker pull vibishnathang/shadow-tracker:latest

# Run container
docker run -d -p 8081:80 --name shadow-tracker-v7 vibishnathang/shadow-tracker:v7
```

---

### 🔐 SHA256 Checksums
```
92d0f5788335a303b44e93508ee81135a2624d99432cee9bbd74984d1f346be3  Shadow-Tracker-Portable.exe
46beca1cdbbba8db69ba0bfceb431ef79ead0ecfb8794e2bd0fbee648ef4cbbb  Shadow-Tracker-Setup.exe
1728c8a556d8a7b0ac46b0f004ff526a61da436ddba4aec4725e11efa20083c1  Shadow-Tracker-Release.apk
d16215ca471a8b1c535666f6503282af039cbceb5dce588dad3b09969bd80a7a  shadow-tracker-web-export.tar.gz
956a038e20d79adf4533dcaa71e60c4f2d3edefe73718c5e30863ca4e4e0467e  shadow-tracker-container.tar.gz
```
