import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config — turn this web app into a real Android APK / AAB.
 * Run:
 *   npm run build
 *   npx cap add android        (one time)
 *   npx cap sync android       (after each build)
 *   cd android && ./gradlew assembleDebug   -> app-debug.apk
 */
const config: CapacitorConfig = {
  appId: "com.momentum.habits",
  appName: "Momentum",
  webDir: "dist",
  backgroundColor: "#0b0d12",
  android: {
    backgroundColor: "#0b0d12",
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
