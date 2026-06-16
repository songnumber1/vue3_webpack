/**
 * @file composables/ui/useOverlayScrollbar.js
 * @description Vue ref 대상에 OverlayScrollbars를 안전하게 연결합니다.
 */
import {nextTick, onBeforeUnmount, onMounted, watch} from "vue";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import {
  destroyOverlayScrollbar,
  getOverlayScrollbarViewport,
  initOverlayScrollbar,
  updateOverlayScrollbar,
} from "@/platform/scroll/overlayScrollbarController";

export function useOverlayScrollbar(targetRef, options = {}, config = {}) {
  let instance = null;
  let instanceElement = null;
  let resizeObserver = null;
  let removeWindowResizeListener = null;
  const enabled = config.enabled ?? true;
  const reserveScrollbarGap = config.reserveScrollbarGap ?? true;
  const {shouldUseOverlayScrollbar} = useOverlayScrollPolicy();

  function resolveLocalEnabled() {
    return typeof enabled === "function" ? enabled() : Boolean(enabled);
  }

  function resolveEnabled() {
    return resolveLocalEnabled() && shouldUseOverlayScrollbar.value;
  }

  async function setup() {
    if (!resolveEnabled()) return;
    await nextTick();
    const element = targetRef.value;
    if (!element) return;
    if (instanceElement && instanceElement !== element) {
      destroy();
    }
    instance = initOverlayScrollbar(element, options, {
      enabled: resolveEnabled,
    });
    instanceElement = instance ? element : null;
    if (instance && reserveScrollbarGap && element?.dataset) {
      element.dataset.overlayScrollbarGap = "true";
    }
    if (instance) bindWindowResizeUpdate();
    if (typeof ResizeObserver !== "undefined" && instance) {
      resizeObserver?.disconnect?.();
      resizeObserver = new ResizeObserver(() => update());
      resizeObserver.observe(element);
    }
    if (instance) schedulePostSetupUpdates();
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
    removeWindowResizeListener?.();
    const element = instanceElement || targetRef.value;
    if (element) {
      if (element.dataset) delete element.dataset.overlayScrollbarGap;
      destroyOverlayScrollbar(element);
    }
    instance = null;
    instanceElement = null;
  }

  function schedulePostSetupUpdates() {
    if (!instance || typeof window === "undefined") {
      update();
      return;
    }

    window.requestAnimationFrame(() => {
      update();
      window.requestAnimationFrame(() => update());
    });
  }

  function bindWindowResizeUpdate() {
    if (removeWindowResizeListener || typeof window === "undefined") return;
    const handleResize = () => update();
    window.addEventListener("resize", handleResize, {passive: true});
    removeWindowResizeListener = () => {
      window.removeEventListener("resize", handleResize);
      removeWindowResizeListener = null;
    };
  }

  onMounted(async () => {
    await setup();
    bindWindowResizeUpdate();
  });
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
