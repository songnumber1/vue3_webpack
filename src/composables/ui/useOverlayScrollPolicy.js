/**
 * @file composables/ui/useOverlayScrollPolicy.js
 * @description OverlayScrollbars 사용 여부를 한 곳에서 판별하는 정책 composable입니다.
 * 기본 모드는 전체 런타임에서 OverlayScrollbars를 사용하도록 ALL로 전환합니다.
 */
import {computed} from "vue";
import {usePlatformStore} from "@/stores/platformStore";
import {
  OVERLAY_SCROLL_MODE,
  isActualAndroidOverlayRuntime,
  shouldUseOverlayScrollbarForRuntime,
} from "@/utils/overlayScrollPolicy";

export {OVERLAY_SCROLL_MODE, isActualAndroidOverlayRuntime};

/**
 * OverlayScrollbars 사용 정책을 제공합니다.
 * OverlayScrollbars 사용 여부를 단일 정책으로 제공합니다.
 * @returns {object} OverlayScroll 정책 계산값 묶음
 */
export function useOverlayScrollPolicy() {
  const platformStore = usePlatformStore();

  const platformInfo = computed(() => platformStore.info || {});
  const overlayScrollMode = computed(() => OVERLAY_SCROLL_MODE.ALL);
  const isActualAndroidRuntime = computed(() =>
    isActualAndroidOverlayRuntime(platformInfo.value)
  );

  const shouldUseOverlayScrollbar = computed(() =>
    shouldUseOverlayScrollbarForRuntime(
      platformInfo.value,
      overlayScrollMode.value
    )
  );

  const shouldUseNativeScrollbar = computed(
    () => !shouldUseOverlayScrollbar.value
  );

  const scrollRuntimeClass = computed(() =>
    shouldUseOverlayScrollbar.value
      ? "overlay-scroll-runtime"
      : "native-scroll-runtime"
  );

  return {
    platformInfo,
    overlayScrollMode,
    isActualAndroidRuntime,
    shouldUseOverlayScrollbar,
    shouldUseNativeScrollbar,
    scrollRuntimeClass,
  };
}
