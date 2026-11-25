import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.jaridalive.app",
  appName: "جريدة الأفق",
  webDir: "dist/public",
  server: {
    // Allows loading live updates from Vercel while having native Android app capabilities
    url: "https://jarida-tan.vercel.app",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
