/**
 * @file composables/ui/useOverlayScrollbar.js
 * @description Vue ref 대상에 OverlayScrollbars를 안전하게 연결합니다.
 */
import {nextTick, onBeforeUnmount, onMounted, watch} from "vue";
import {usePlatformStore} from "@/stores/platformStore";
import {
  destroyOverlayScrollbar,
  getOverlayScrollbarViewport,
  initOverlayScrollbar,
  updateOverlayScrollbar,
} from "@/utils/overlayScrollbar";

export function useOverlayScrollbar(targetRef, options = {}, config = {}) {
  let instance = null;
  let resizeObserver = null;
  const enabled = config.enabled ?? true;
  const disableOnMobile = config.disableOnMobile ?? true;
  const reserveScrollbarGap = config.reserveScrollbarGap ?? true;
  const platformStore = usePlatformStore();

  function isActualAndroidRuntime() {
    const info = platformStore.info || {};
    const userAgent = String(info.userAgent || "");
    return Boolean(
      info.actualEnv === "android" ||
        info.actualDevice === "android" ||
        info.actualDevice === "android-webview" ||
        info.actualBrowser === "android-webview" ||
        info.isAndroidApp ||
        /Android/i.test(userAgent)
    );
  }

  function isNativeScrollPlatform() {
    return disableOnMobile && isActualAndroidRuntime();
  }

  function resolveEnabled() {
    if (isNativeScrollPlatform()) return false;
    return typeof enabled === "function" ? enabled() : Boolean(enabled);
  }

  async function setup() {
    if (!resolveEnabled()) return;
    await nextTick();
    const element = targetRef.value;
    if (!element) return;
    instance = initOverlayScrollbar(element, options);
    if (instance && reserveScrollbarGap && element?.dataset) {
      element.dataset.overlayScrollbarGap = "true";
    }
    if (typeof ResizeObserver !== "undefined" && instance) {
      resizeObserver?.disconnect?.();
      resizeObserver = new ResizeObserver(() => update());
      resizeObserver.observe(element);
    }
  }

  function update() {
    const element = targetRef.value;
    if (!element) return;
    updateOverlayScrollbar(element);
  }

  function getViewport() {
    return getOverlayScrollbarViewport(targetRef.value);
  }

  function destroy() {
    resizeObserver?.disconnect?.();
    resizeObserver = null;
    if (targetRef.value) {
      if (targetRef.value.dataset) delete targetRef.value.dataset.overlayScrollbarGap;
      destroyOverlayScrollbar(targetRef.value);
    }
    instance = null;
  }

  onMounted(setup);
  onBeforeUnmount(destroy);

  watch(
    () => [resolveEnabled(), targetRef.value],
    async ([enabledNow]) => {
      if (!enabledNow) {
        destroy();
        return;
      }
      await setup();
      update();
    },
    {flush: "post"}
  );

  if (config.watchSource) {
    watch(
      config.watchSource,
      async () => {
        if (!resolveEnabled()) {
          destroy();
          return;
        }
        await setup();
        update();
      },
      {flush: "post"}
    );
  }

  return {setup, update, destroy, getViewport};
}
