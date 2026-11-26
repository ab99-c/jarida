/**
 * Resolves the backend base URL dynamically.
 * When running inside a native mobile APK (Capacitor/WebView) where the page
 * is served from https://localhost, capacitor://, or file://, relative requests
 * to /api/... would hit the local device server which only serves static files.
 * In that environment, we prepend the production backend URL.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const isNativeOrLocal =
      protocol === "capacitor:" ||
      protocol === "file:" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1";

    if (isNativeOrLocal) {
      return "https://jarida-tan.vercel.app";
    }
  }
  return "";
}
