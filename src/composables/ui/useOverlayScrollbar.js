/**
 * @file composables/ui/useOverlayScrollbar.js
 * @description Vue ref 대상에 OverlayScrollbars를 안전하게 연결합니다.
 */
import {nextTick, onBeforeUnmount, onMounted, watch} from "vue";
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

  function resolveEnabled() {
    return typeof enabled === "function" ? enabled() : Boolean(enabled);
  }

  async function setup() {
    if (!resolveEnabled()) return;
    await nextTick();
    const element = targetRef.value;
    if (!element) return;
    instance = initOverlayScrollbar(element, options);
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
    if (targetRef.value) destroyOverlayScrollbar(targetRef.value);
    instance = null;
  }

  onMounted(setup);
  onBeforeUnmount(destroy);

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
