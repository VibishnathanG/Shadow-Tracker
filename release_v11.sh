#!/bin/bash
set -e

echo "Cleaning up..."
rm -rf out
rm -rf android/app/build
rm -rf android/app/release
rm -rf src-tauri/target/release
rm -rf node_modules/.cache
rm -f shadow-tracker-web-v11.tar.gz
rm -f shadow-tracker-docker-v11.tar
rm -f shadow-tracker-v11.apk
rm -f SHA256SUMS.txt

echo "Building Next.js..."
npm run build

echo "Building Docker..."
docker build -t vibishnathang/shadow-tracker:latest -t vibishnathang/shadow-tracker:v11.0.0 .
docker push vibishnathang/shadow-tracker:latest
docker push vibishnathang/shadow-tracker:v11.0.0

echo "Building Android APK..."
npx cap copy android
cd android
./gradlew assembleRelease
cd ..

echo "Building Windows EXE (Tauri)..."
npm run build:tauri || echo "Tauri build might fail if Rust is not configured, skipping if so..."

echo "Preparing Release Assets..."
cp android/app/build/outputs/apk/release/app-release.apk shadow-tracker-v11.apk || true
cp android/app/build/outputs/apk/release/app-release.apk release/Shadow-Tracker-Release.apk || true
cp src-tauri/target/release/bundle/nsis/*.exe shadow-tracker-v11-setup.exe || true
tar -czf shadow-tracker-web-v11.tar.gz out/
tar -czf release/shadow-tracker-web-export.tar.gz out/
docker save vibishnathang/shadow-tracker:v11.0.0 -o shadow-tracker-docker-v11.tar
docker save vibishnathang/shadow-tracker:v11.0.0 | gzip > release/shadow-tracker-container.tar.gz

sha256sum shadow-tracker-v11.apk shadow-tracker-web-v11.tar.gz shadow-tracker-docker-v11.tar > SHA256SUMS.txt || true
(cd release && sha256sum Shadow-Tracker-Release.apk shadow-tracker-web-export.tar.gz shadow-tracker-container.tar.gz Shadow-Tracker-Portable.exe Shadow-Tracker-Setup.exe Shadow-Tracker-Windows-Certificate.crt WebView2Loader.dll > SHA256SUMS.txt) || true

echo "Pushing to GitHub..."
git add .
git commit -m "chore(release): v11.0.0" || true
git push origin main || true
git tag v11.0.0 || true
git tag v11 || true
git push origin v11.0.0 v11 || true

echo "Creating GitHub Release v11.0.0..."
gh release create v11.0.0 shadow-tracker-v11.apk shadow-tracker-web-v11.tar.gz shadow-tracker-docker-v11.tar SHA256SUMS.txt --title "v11.0.0 Release - Micronutrient Engine & Velocity Tracker" --notes-file release/RELEASE_NOTES_v11.md || echo "Release might already exist or gh cli not authenticated."

echo "Done!"
