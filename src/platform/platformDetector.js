import {
  RUN_ENV,
  PLATFORM,
  hasAndroidBridge,
  hasExtensionRuntime,
} from "@/core/config/appConfig";
import {logPlatformDebug} from "@/platform/platformDebug";
import {
  createActualPlatformInfo,
  detectDevice,
  getAppVersionFromBridge,
  getBridgeVersionFromBridge,
  getBrowserName,
  getBrowserVersion,
  getNavigator,
  getScreen,
  isSupportedBrowserName,
  isSupportedMobileMicBrowser,
  resolveBasePlatform,
} from "./browserDetector";
import {resolveViewportInfo} from "./mobileViewportInfo";

export function resolveDetailedPlatform(baseAppInfo = {}) {
  const nav = getNavigator();
  const screen = getScreen();
  const ua = nav.userAgent || "";
  const navPlatform = nav.platform || "";
  const hasBridge = hasAndroidBridge();

  const detectedBrowserName = getBrowserName(ua, hasBridge);
  const detectedBrowserVersion = getBrowserVersion(ua, detectedBrowserName);
  const detectedEnv = resolveBasePlatform(
    baseAppInfo.platform,
    ua,
    navPlatform
  );
  const detectedRuntime = hasBridge
    ? RUN_ENV.NATIVE
    : hasExtensionRuntime()
      ? RUN_ENV.EXTENSION
      : RUN_ENV.BROWSER;
  const detectedDevice = detectDevice(detectedEnv, detectedBrowserName);
  const actualPlatform = createActualPlatformInfo(
    detectedEnv,
    detectedRuntime,
    detectedDevice,
    detectedBrowserName,
    detectedBrowserVersion
  );
  const browserName = detectedBrowserName;
  const browserVersion = detectedBrowserVersion;
  const env = detectedEnv;
  const runtime = detectedRuntime;
  const device = detectedDevice;
  const isAndroid = env === PLATFORM.ANDROID;
  const isNativeApp = runtime === RUN_ENV.NATIVE;
  const isAndroidApp = isAndroid && hasBridge;
  const isAndroidWebView = isAndroid && browserName === "android-webview";
  const isBrowserRuntime = !isNativeApp;
  const isActuallySamsungBrowser =
    actualPlatform.browser === "samsung-browser" ||
    /SamsungBrowser\//i.test(ua);
  const isSupportedRuntime =
    !isActuallySamsungBrowser && isSupportedBrowserName(browserName);
  const isUnsupportedBrowser = !isSupportedRuntime;
  const unsupportedReason = isActuallySamsungBrowser
    ? "unsupported-samsung-browser"
    : isUnsupportedBrowser
      ? "unsupported-browser"
      : "";
  const isAccess = !isUnsupportedBrowser;
  const viewportInfo = resolveViewportInfo(baseAppInfo);
  const isMic = isSupportedMobileMicBrowser(
    isAndroid,
    isBrowserRuntime,
    browserName
  );
  logPlatformDebug("platform.resolve", {
    actualPlatform: actualPlatform.label,
    resolved: {
      env,
      runtime,
      device,
      browser: browserName,
      isAndroid,
      isBrowserRuntime,
      isAndroidApp,
    },
    viewport: {
      width: viewportInfo.width,
      height: viewportInfo.height,
      visualWidth: viewportInfo.visualWidth,
      compactWidth: viewportInfo.compactWidth,
    },
  });

  return {
    env,
    runtime,
    device,
    browser: browserName,
    browserVersion,
    userAgent: ua,
    platform: navPlatform,
    actualPlatform,
    actualEnv: actualPlatform.env,
    actualRuntime: actualPlatform.runtime,
    actualDevice: actualPlatform.device,
    actualBrowser: actualPlatform.browser,
    actualBrowserVersion: actualPlatform.browserVersion,
    actualPlatformLabel: actualPlatform.label,
    language: nav.language || "",
    languages: Array.from(nav.languages || []),
    isAccess,
    unsupportedReason,
    isAndroid,
    isNativeApp,
    isNativeRuntime: isNativeApp,
    isAndroidApp,
    isAndroidWebView,
    isBrowserRuntime,
    isMic,
    isChrome: browserName === "chrome",
    isFirefox: browserName === "firefox",
    isSupportedRuntime,
    isSamsungBrowser: isActuallySamsungBrowser,
    appVersion: getAppVersionFromBridge() || baseAppInfo.appVersion || "1.0.0",
    appBuildVersion: baseAppInfo.appBuildVersion || "",
    bridgeVersion:
      getBridgeVersionFromBridge() || baseAppInfo.bridgeVersion || "",
    deviceId: baseAppInfo.deviceId || null,
    token: baseAppInfo.token || "",
    screen: {
      width: screen.width || 0,
      height: screen.height || 0,
      pixelRatio:
        typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
    },
    viewport: {width: viewportInfo.width, height: viewportInfo.height},
    updatedAt: new Date().toISOString(),
  };
}
