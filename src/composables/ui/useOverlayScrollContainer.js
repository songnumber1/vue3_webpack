/**
 * @file composables/ui/useOverlayScrollContainer.js
 * @description
 * OverlayScrollbars viewport와 Android keyboard-aware 보정 controller를 하나의
 * scroll container adapter로 묶어 제공합니다. 화면 적용은 단계적으로 진행하며,
 * 이 composable은 공통 OverlayScrollContainer와 Studio form 화면에서 재사용할
 * 기준 API만 제공합니다.
 */

import {computed, unref} from "vue";
import {useOverlayKeyboardScrollController} from "@/composables/ui/useOverlayKeyboardScrollController";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";

function resolveMaybeRef(value) {
  if (typeof value === "function") return value();
  return unref(value);
}

function resolveBoolean(value, fallback = false) {
  const resolved = resolveMaybeRef(value);
  return resolved === undefined || resolved === null
    ? fallback
    : Boolean(resolved);
}

/**
 * OverlayScrollbars 기반 scroll container controller를 생성합니다.
 * @param {import('vue').Ref<HTMLElement|null>} targetRef
 * @param {object} options
 * @param {boolean|import('vue').Ref<boolean>|Function} [options.enabled=true]
 * @param {boolean|import('vue').Ref<boolean>|Function} [options.keyboardAware=false]
 * @param {object} [options.overlayOptions]
 * @param {object} [options.keyboardOptions]
 * @param {boolean} [options.reserveScrollbarGap=true]
 * @returns {object} Overlay scroll container adapter
 */
export function useOverlayScrollContainer(targetRef, options = {}) {
  const {isActualAndroidRuntime} = useOverlayScrollPolicy();

  const overlayEnabled = computed(() => resolveBoolean(options.enabled, true));
  const keyboardAware = computed(() =>
    resolveBoolean(options.keyboardAware, false)
  );
  const keyboardControllerEnabled = computed(
    () =>
      overlayEnabled.value &&
      keyboardAware.value &&
      isActualAndroidRuntime.value
  );

  const overlay = useOverlayScrollbar(targetRef, options.overlayOptions || {}, {
    enabled: () => overlayEnabled.value,
    reserveScrollbarGap: options.reserveScrollbarGap ?? true,
  });

  const keyboardController = useOverlayKeyboardScrollController({
    ...(options.keyboardOptions || {}),
    enabled: () => keyboardControllerEnabled.value,
    viewport: overlay,
    updateOverlay: overlay.update,
  });

  function getViewport() {
    return overlay.getViewport();
  }

  return {
    overlay,
    keyboardController,
    overlayEnabled,
    keyboardAware,
    keyboardControllerEnabled,
    setup: overlay.setup,
    update: overlay.update,
    destroy: overlay.destroy,
    getViewport,
    handleFocusIn: keyboardController.handleFocusIn,
    handleFocusOut: keyboardController.handleFocusOut,
    handlePointerDown: keyboardController.handlePointerDown,
  };
}
