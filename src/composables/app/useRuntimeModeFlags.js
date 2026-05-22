import {computed} from "vue";
import {usePlatformStore} from "@/stores/platformStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useViewportStore} from "@/platform/viewport/viewportStore";

function hasBodyMobileMode() {
  return (
    typeof document !== "undefined" &&
    document.body?.classList?.contains("mobile-mode")
  );
}

/**
 * 화면 크기와 실행 환경을 분리해서 제공하는 공통 runtime flag입니다.
 * - isCompactViewport: 현재 viewport 폭 기준
 * - isNativeRuntime: Android/iOS 앱웹 같은 native bridge runtime 기준
 * - isAndroidApp: Android bridge 기준
 * - isMobileBrowser: native가 아닌 모바일 브라우저 기준
 */
export function useRuntimeModeFlags() {
  const platformStore = usePlatformStore();
  const systemSettingsStore = useSystemSettingsStore();
  const viewportStore = useViewportStore();
  viewportStore.setBreakpoint(systemSettingsStore.mobileBreakpoint);

  const platformInfo = computed(() => platformStore.info || {});
  const isCompactViewport = computed(() =>
    Boolean(
      viewportStore.isCompact || hasBodyMobileMode()
    )
  );
  const isNativeRuntime = computed(() =>
    Boolean(
      platformInfo.value.isNativeRuntime || platformInfo.value.isNativeApp
    )
  );
  const isAndroidApp = computed(() => Boolean(platformInfo.value.isAndroidApp));
  const isMobileBrowser = computed(() =>
    Boolean(platformInfo.value.isMobileBrowser)
  );
  const shouldUseMobileLayout = computed(() =>
    Boolean(
      isCompactViewport.value ||
      isAndroidApp.value ||
      platformInfo.value.isIosApp ||
      isMobileBrowser.value
    )
  );

  return {
    platformInfo,
    isCompactViewport,
    isNativeRuntime,
    isAndroidApp,
    isMobileBrowser,
    shouldUseMobileLayout,
  };
}
