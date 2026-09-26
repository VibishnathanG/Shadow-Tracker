#!/bin/bash
set -e

echo "Cleaning up..."
rm -rf out
rm -rf android/app/build
rm -rf android/app/release
rm -rf src-tauri/target/release
rm -rf node_modules/.cache
rm -f shadow-tracker-web.tar.gz
rm -f shadow-tracker-docker.tar
rm -f SHA256SUMS.txt

echo "Building Next.js..."
npm run build

echo "Building Docker..."
docker build -t vibishnathang/shadow-tracker:latest -t vibishnathang/shadow-tracker:v10.0.0 .
docker push vibishnathang/shadow-tracker:latest
docker push vibishnathang/shadow-tracker:v10.0.0

echo "Building Android APK..."
npx cap copy android
cd android
./gradlew assembleRelease
cd ..

echo "Building Windows EXE (Tauri)..."
npm run build:tauri || echo "Tauri build might fail if Rust is not configured, skipping if so..."

echo "Preparing Release Assets..."
cp android/app/build/outputs/apk/release/app-release.apk shadow-tracker-v10.apk || true
cp src-tauri/target/release/bundle/nsis/*.exe shadow-tracker-v10-setup.exe || true
tar -czf shadow-tracker-web-v10.tar.gz out/
docker save vibishnathang/shadow-tracker:v10.0.0 -o shadow-tracker-docker-v10.tar

sha256sum shadow-tracker-v10.apk shadow-tracker-v10-setup.exe shadow-tracker-web-v10.tar.gz shadow-tracker-docker-v10.tar > SHA256SUMS.txt || true

echo "Pushing to GitHub..."
git add .
git commit -m "chore: release v10.0.0" || true
git push origin main || true
git tag v10.0.0 || true
git push origin v10.0.0 || true

echo "Creating GitHub Release v10.0.0..."
gh release create v10.0.0 shadow-tracker-v10.apk shadow-tracker-v10-setup.exe shadow-tracker-web-v10.tar.gz shadow-tracker-docker-v10.tar SHA256SUMS.txt --title "v10.0.0 Release" --notes "v10 release" || echo "Release might already exist or gh cli not authenticated."

echo "Done!"
