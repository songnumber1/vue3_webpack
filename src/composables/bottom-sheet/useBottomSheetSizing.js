import {computed, nextTick, onBeforeUnmount, ref, watch} from "vue";
import {useScrollLock} from "@vueuse/core";
import {createBottomSheetDrag} from "./useBottomSheetDrag";
import {createBottomSheetSnap} from "./useBottomSheetSnap";
import {
  createBottomSheetViewport,
  createBottomSheetViewportListeners,
  createBottomSheetViewportScheduler,
} from "./useBottomSheetViewport";

/**
 * @description 바텀시트 크기, snap, drag, viewport listener를 조합합니다.
 * @param {object} props - BaseBottomSheet props입니다.
 * @param {Function} emit - BaseBottomSheet emit 함수입니다.
 * @returns {object} BaseBottomSheet에서 사용하는 ref와 제어 함수입니다.
 */
export function useBottomSheetSizing(props, emit) {
  const sheetRef = ref(null);
  const bodyRef = ref(null);
  const dragging = ref(false);
  const currentHeight = ref(320);
  const currentSnap = ref("content");

  const bodyScrollLocked =
    typeof document === "undefined" ? ref(false) : useScrollLock(document.body);
  let measureRaf = 0;

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
      } else {
        unlockBodyScroll();
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
