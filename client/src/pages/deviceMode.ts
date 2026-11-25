export type JaridaViewMode = "single" | "spread";

export type JaridaDeviceKind = "android-tv" | "android-phone" | "mobile" | "desktop";

export interface DeviceEnvironment {
  userAgent: string;
  viewportWidth: number;
  viewportHeight?: number;
  search?: string;
}

const ANDROID_TV_RE =
  /Android.*(?:TV|BRAVIA|AFT[A-Z0-9]*|SHIELD|MiBOX|MIBOX|GoogleTV|SmartTV|CrKey|ADT-)|GoogleTV|SmartTV|WebTV|HbbTV|Leanback/i;

const ANDROID_RE = /Android/i;

export function detectDeviceKind(env: DeviceEnvironment): JaridaDeviceKind {
  const ua = env.userAgent || "";
  if (ANDROID_TV_RE.test(ua)) {
    return "android-tv";
  }
  if (ANDROID_RE.test(ua)) {
    return "android-phone";
  }
  if (env.viewportWidth < 1024) {
    return "mobile";
  }
  return "desktop";
}

export function getDefaultViewMode(
  env: DeviceEnvironment,
  savedPreference?: string | null,
): JaridaViewMode {
  if (env.search) {
    const params = new URLSearchParams(env.search);
    const forced = params.get("view") || params.get("mode");
    if (forced === "single" || forced === "spread") {
      return forced;
    }
  }

  if (savedPreference === "single" || savedPreference === "spread") {
    return savedPreference;
  }

  const device = detectDeviceKind(env);
  if (device === "android-tv" || device === "android-phone" || device === "mobile") {
    return "single";
  }

  return "spread";
}

export function convertPageIndexBetweenModes(
  currentPage: number,
  fromMode: JaridaViewMode,
  toMode: JaridaViewMode,
  totalArticles: number,
): number {
  if (totalArticles <= 0 || fromMode === toMode) {
    return Math.max(0, currentPage);
  }

  const fromPerView = fromMode === "single" ? 1 : 2;
  const toPerView = toMode === "single" ? 1 : 2;
  const firstVisibleArticle = currentPage * fromPerView;
  const maxTargetPage = Math.max(0, Math.ceil(totalArticles / toPerView) - 1);
  return Math.max(0, Math.min(maxTargetPage, Math.floor(firstVisibleArticle / toPerView)));
}
