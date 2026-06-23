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
import {
  getForcedPlatformOverride,
  resolveForcedPlatform,
} from "./platformOverride";
import {resolveViewportInfo} from "./platformBreakpoint";

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
  const detectedDevice = detectDevice({
    env: detectedEnv,
    browserName: detectedBrowserName,
  });
  const actualPlatform = createActualPlatformInfo({
    env: detectedEnv,
    runtime: detectedRuntime,
    device: detectedDevice,
    browserName: detectedBrowserName,
    browserVersion: detectedBrowserVersion,
  });
  const forcedPlatform = resolveForcedPlatform({
    baseAppInfo,
    detected: {
      env: detectedEnv,
      runtime: detectedRuntime,
      device: detectedDevice,
      browserName: detectedBrowserName,
      browserVersion: detectedBrowserVersion,
    },
  });

  const browserName = forcedPlatform.browserName;
  const browserVersion = forcedPlatform.browserVersion;
  const env = forcedPlatform.env;
  const runtime = forcedPlatform.runtime;
  const device = forcedPlatform.device;
  const isAndroid = env === PLATFORM.ANDROID;
  const isWindows = env === PLATFORM.WINDOWS;
  const isNativeApp = runtime === RUN_ENV.NATIVE;
  const isAndroidApp = isAndroid && hasBridge;
  const isAndroidWebView = isAndroid && browserName === "android-webview";
  const isMobile = isAndroid;
  const isMobileBrowser = isMobile && !isNativeApp && browserName === "chrome";
  const isActuallySamsungBrowser =
    actualPlatform.browser === "samsung-browser" ||
    /SamsungBrowser\//i.test(ua);
  const isSupportedRuntime =
    !isActuallySamsungBrowser &&
    (forcedPlatform.isForced || isSupportedBrowserName(browserName, {env}));
  const isUnsupportedBrowser = !isSupportedRuntime;
  const unsupportedReason = isActuallySamsungBrowser
    ? "unsupported-samsung-browser"
    : isUnsupportedBrowser
      ? "unsupported-browser"
      : "";
  const isAccess = !isUnsupportedBrowser;
  const viewportInfo = resolveViewportInfo(baseAppInfo);
  const isMic = isSupportedMobileMicBrowser({
    isAndroid,
    isMobileBrowser,
    browserName,
  });
  const platformOverride = getForcedPlatformOverride(
    baseAppInfo.platformOverride
  );

  logPlatformDebug("platform.resolve", {
    platformOverride,
    isPlatformForced: forcedPlatform.isForced,
    actualPlatform: actualPlatform.label,
    resolved: {
      env,
      runtime,
      device,
      browser: browserName,
      isAndroid,
      isMobile,
      isMobileBrowser,
      isAndroidApp,
      isCompactViewport: viewportInfo.isCompactViewport,
    },
    viewport: {
      width: viewportInfo.width,
      height: viewportInfo.height,
      visualWidth: viewportInfo.visualWidth,
      compactWidth: viewportInfo.compactWidth,
      compactBreakpoint: viewportInfo.compactBreakpoint,
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
    isWindows,
    isAndroid,
    isNativeApp,
    isNativeRuntime: isNativeApp,
    isCompactViewport: viewportInfo.isCompactViewport,
    isAndroidApp,
    isAndroidWebView,
    isMobile,
    isMobileBrowser,
    isMic,
    isPlatformForced: forcedPlatform.isForced,
    platformOverride,
    isChrome: browserName === "chrome",
    isFirefox: browserName === "firefox",
    isSupportedRuntime,
    isSamsungBrowser: isActuallySamsungBrowser,
    isPc: isWindows || env === PLATFORM.MAC || env === PLATFORM.LINUX,
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
    compactBreakpoint: viewportInfo.compactBreakpoint,
    updatedAt: new Date().toISOString(),
  };
}
