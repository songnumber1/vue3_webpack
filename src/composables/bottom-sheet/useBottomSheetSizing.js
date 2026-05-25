/**
 * @file composables/bottom-sheet/useBottomSheetSizing.js
 * @description 모바일 BottomSheet의 drag, size, viewport 보정을 담당합니다. keyboard/VisualViewport 영향이 크므로 동작 변경에 주의해야 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

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
