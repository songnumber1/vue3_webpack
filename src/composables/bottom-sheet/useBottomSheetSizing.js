import {computed, nextTick, onBeforeUnmount, ref, watch} from "vue";
import {useScrollLock} from "@vueuse/core";
import {createBottomSheetDrag} from "./useBottomSheetDrag";
import {createBottomSheetSnap} from "./useBottomSheetSnap";
import {
  createBottomSheetViewport,
  createBottomSheetViewportListeners,
  createBottomSheetViewportScheduler,
} from "./useBottomSheetViewport";

export function useBottomSheetSizing(props, emit) {
  const sheetRef = ref(null);
  const bodyRef = ref(null);
  const dragging = ref(false);
  const currentHeight = ref(320);
  const currentSnap = ref("content");

  const bodyScrollLocked =
    typeof document === "undefined" ? ref(false) : useScrollLock(document.body);

  let measureRaf = 0;
  let bodyObserver = null;

  const sheetStyle = computed(() => ({
    "--bottom-sheet-height": `${Math.round(currentHeight.value)}px`,
  }));

  const viewport = createBottomSheetViewport({
    bodyRef,
    props,
    sheetRef,
  });

  const {collapse, expand, setHeight} = createBottomSheetSnap({
    clampHeight: viewport.clampHeight,
    currentHeight,
    currentSnap,
    getViewportHeight: viewport.getViewportHeight,
    props,
  });

  const {scheduleViewportRefresh, clearViewportRefresh} =
    createBottomSheetViewportScheduler({
      currentHeight,
      currentSnap,
      props,
      setHeight,
    });

  const {registerViewportListeners, unregisterViewportListeners} =
    createBottomSheetViewportListeners(scheduleViewportRefresh);

  const {cleanupDrag, startDrag} = createBottomSheetDrag({
    currentHeight,
    dragging,
    emit,
    expand,
    getViewportHeight: viewport.getViewportHeight,
    props,
    setHeight,
  });

  function measureOpeningHeight() {
    setHeight(viewport.getInitialHeight(), props.initialSnap);
  }

  function resetHeight() {
    window.cancelAnimationFrame?.(measureRaf);
    nextTick(() => {
      measureRaf = window.requestAnimationFrame
        ? window.requestAnimationFrame(measureOpeningHeight)
        : window.setTimeout(measureOpeningHeight, 0);
    });
  }

  function observeBodySize() {
    bodyObserver?.disconnect?.();
    if (typeof MutationObserver === "undefined" || !bodyRef.value) return;

    bodyObserver = new MutationObserver(scheduleViewportRefresh);
    bodyObserver.observe(bodyRef.value, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function disconnectBodyObserver() {
    bodyObserver?.disconnect?.();
    bodyObserver = null;
  }

  function lockBodyScroll() {
    bodyScrollLocked.value = true;
  }

  function unlockBodyScroll() {
    bodyScrollLocked.value = false;
  }

  watch(
    () => props.open,
    (isOpen) => {
      if (isOpen) {
        lockBodyScroll();
        resetHeight();
        registerViewportListeners();
        nextTick(observeBodySize);
      } else {
        unlockBodyScroll();
        disconnectBodyObserver();
        unregisterViewportListeners();
      }
    },
    {immediate: true}
  );

  onBeforeUnmount(() => {
    unlockBodyScroll();
    clearViewportRefresh();
    if (measureRaf) window.cancelAnimationFrame?.(measureRaf);
    cleanupDrag();
    disconnectBodyObserver();
    unregisterViewportListeners();
  });

  return {
    bodyRef,
    collapse,
    currentSnap,
    dragging,
    expand,
    sheetRef,
    sheetStyle,
    startDrag,
  };
}
