import {RUN_ENV, PLATFORM} from "@/core/config";
import {PLATFORM_OVERRIDE_MODES} from "@/constants/systemSettings";

export function getForcedPlatformOverride(value) {
  return Object.values(PLATFORM_OVERRIDE_MODES).includes(value)
    ? value
    : PLATFORM_OVERRIDE_MODES.auto;
}

export function resolveForcedPlatform({baseAppInfo, detected}) {
  const override = getForcedPlatformOverride(baseAppInfo.platformOverride);

  if (override === PLATFORM_OVERRIDE_MODES.androidChrome) {
    return {
      ...detected,
      env: PLATFORM.ANDROID,
      runtime: RUN_ENV.BROWSER,
      device: "chrome",
      browserName: "chrome",
      browserVersion: detected.browserVersion || "",
      isForced: true,
    };
  }

  if (override === PLATFORM_OVERRIDE_MODES.androidWebView) {
    return {
      ...detected,
      env: PLATFORM.ANDROID,
      runtime: RUN_ENV.BROWSER,
      device: "android-webview",
      browserName: "android-webview",
      browserVersion: detected.browserVersion || "",
      isForced: true,
    };
  }

  return {...detected, isForced: false};
}
