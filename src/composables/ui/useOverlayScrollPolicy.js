/**
 * @file composables/ui/useOverlayScrollPolicy.js
 * @description 모바일 전용 OverlayScrollbars 사용 정책을 제공합니다.
 */
import {computed, readonly, ref} from "vue";
import {usePlatformStore} from "@/stores/platformStore";
import {
  DEFAULT_OVERLAY_SCROLL_MODE,
  OVERLAY_SCROLL_MODE,
  isActualAndroidOverlayRuntime,
} from "@/platform/scroll/scrollRuntimePolicy";

const overlayScrollEnabled = readonly(ref(true));
const nativeScrollEnabled = readonly(ref(false));

export {
  DEFAULT_OVERLAY_SCROLL_MODE,
  OVERLAY_SCROLL_MODE,
  isActualAndroidOverlayRuntime,
};

export function useOverlayScrollPolicy() {
  const platformStore = usePlatformStore();
  const platformInfo = computed(() => platformStore.info || {});
  const overlayScrollMode = computed(() => DEFAULT_OVERLAY_SCROLL_MODE);
  const isActualAndroidRuntime = computed(() =>
    isActualAndroidOverlayRuntime(platformInfo.value)
  );

  return {
    platformInfo,
    overlayScrollMode,
    isActualAndroidRuntime,
    shouldUseOverlayScrollbar: overlayScrollEnabled,
    shouldUseNativeScrollbar: nativeScrollEnabled,
    scrollRuntimeClass: "overlay-scroll-runtime",
  };
}
