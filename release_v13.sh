#!/usr/bin/env bash
# =============================================================================
# Shadow Tracker — v13.0.0 Release Script
# Builds web, Android APK, Windows executables, Docker image, commits, tags, pushes,
# and publishes the GitHub Release.
# =============================================================================
set -euo pipefail

VERSION="13.0.0"
TAG="v${VERSION}"

echo "========================================="
echo "  🚀 Starting Shadow Tracker ${TAG} Release"
echo "========================================="

echo ""
echo "▶ Running unit tests and typecheck…"
npm test
npx tsc --noEmit
echo "  Quality gates passed."

echo ""
echo "▶ Building Next.js production app…"
npm run build

echo ""
echo "▶ Building Android APK…"
npx cap copy android
(cd android && ./gradlew assembleRelease)

mkdir -p release
cp android/app/build/outputs/apk/release/app-release.apk release/ShadowTracker-v13.apk
cp android/app/build/outputs/apk/release/app-release.apk release/Shadow-Tracker-Release.apk
echo "  Android APK built."

echo ""
echo "▶ Building Windows Executables…"
export PATH="/root/.cargo/bin:$PATH"
npm run build:tauri
cp src-tauri/target/x86_64-pc-windows-gnu/release/shadow-tracker.exe release/Shadow-Tracker-Portable.exe
cp "src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/Shadow Tracker_13.0.0_x64-setup.exe" release/Shadow-Tracker-Setup.exe
echo "  Windows binaries copied."

echo ""
echo "▶ Building Docker image…"
docker build \
  -t "vibishnathang/shadow-tracker:latest" \
  -t "vibishnathang/shadow-tracker:${TAG}" \
  -t "vibishnathang/shadow-tracker:v13" \
  .
echo "  Docker image built."

echo ""
echo "▶ Packaging archives and generating checksums…"
tar -czf "shadow-tracker-web-v13.tar.gz" -C out .
cp shadow-tracker-web-v13.tar.gz release/shadow-tracker-web-export.tar.gz
docker save "vibishnathang/shadow-tracker:${TAG}" | gzip > shadow-tracker-docker-v13.tar.gz
cp shadow-tracker-docker-v13.tar.gz release/shadow-tracker-container.tar.gz

(cd release && sha256sum \
  Shadow-Tracker-Release.apk \
  ShadowTracker-v13.apk \
  Shadow-Tracker-Portable.exe \
  Shadow-Tracker-Setup.exe \
  shadow-tracker-web-export.tar.gz \
  shadow-tracker-container.tar.gz \
  > SHA256SUMS.txt)

sha256sum shadow-tracker-web-v13.tar.gz shadow-tracker-docker-v13.tar.gz > SHA256SUMS.txt
echo "  Checksums updated."

echo ""
echo "========================================="
echo "  ✅ Shadow Tracker ${TAG} Release Staged"
echo "========================================="
