/**
 * @file composables/ui/useOverlayScrollPolicy.js
 * @description 모바일 전용 OverlayScrollbars 사용 정책을 제공합니다.
 */
import {computed} from "vue";
import {usePlatformStore} from "@/stores/platformStore";
import {
  DEFAULT_OVERLAY_SCROLL_MODE,
  OVERLAY_SCROLL_MODE,
  isActualAndroidOverlayRuntime,
} from "@/platform/scroll/scrollRuntimePolicy";

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
    shouldUseOverlayScrollbar: computed(() => true),
    shouldUseNativeScrollbar: computed(() => false),
    scrollRuntimeClass: computed(() => "overlay-scroll-runtime"),
  };
}
