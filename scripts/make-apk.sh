#!/usr/bin/env bash
#
# Build a real Android APK from this web app using Capacitor.
# Requirements: Node 18+, Java 17, Android SDK (Android Studio installed) or `ANDROID_HOME` set.
#
#   chmod +x scripts/make-apk.sh
#   ./scripts/make-apk.sh            # debug APK (installable on any phone)
#   ./scripts/make-apk.sh release     # signed AAB for Play Store (needs keystore)
#
set -euo pipefail

echo "▶ 1/5 Installing dependencies…"
npm install

echo "▶ 2/5 Building web assets…"
npm run build

echo "▶ 3/5 Adding Android platform (first time only)…"
npx cap add android || true
npx cap sync android

MODE="${1:-debug}"
if [[ "$MODE" == "release" ]]; then
  echo "▶ 4/5 Building RELEASE (requires a signing keystore)…"
  cd android
  ./gradlew assembleRelease
  cd ..
  echo ""
  echo "✅ Done! Signed AAB/APK:"
  echo "   android/app/build/outputs/bundle/release/*.aab"
  echo "   android/app/build/outputs/apk/release/*.apk"
  echo ""
  echo "   Create a keystore first with:"
  echo "   keytool -genkey -v -keystore momentum.keystore -alias momentum -keyalg RSA -keysize 2048 -validity 10000"
else
  echo "▶ 4/5 Building DEBUG APK…"
  cd android
  ./gradlew assembleDebug
  cd ..
  echo ""
  echo "✅ Done! Your APK is ready:"
  echo "   android/app/build/outputs/apk/debug/app-debug.apk"
  echo "   Copy it to your phone and enable 'Install unknown apps' to install it."
fi
