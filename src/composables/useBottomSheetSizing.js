import {computed, nextTick, onBeforeUnmount, ref, watch} from 'vue';
import {BOTTOM_SHEET_SNAP_RATIO} from '@/constants/uiTokens';
import {createBottomSheetViewportController} from '@/composables/bottomSheet/useBottomSheetViewport';
import {createBottomSheetMeasurements} from '@/composables/bottomSheet/useBottomSheetMeasurements';
import {createBodyScrollLock} from '@/composables/bottomSheet/useBodyScrollLock';
import {createBottomSheetDragController} from '@/composables/bottomSheet/useBottomSheetDrag';

export function useBottomSheetSizing(props, emit) {
  const sheetRef = ref(null);
  const bodyRef = ref(null);
  const dragging = ref(false);
  const currentHeight = ref(320);
  const currentSnap = ref('content');
  let measureRaf = 0;

  const sheetStyle = computed(() => ({
    '--bottom-sheet-height': `${Math.round(currentHeight.value)}px`,
  }));

  const viewport = createBottomSheetViewportController(() => {
    if (!props.open) return;
    setHeight(currentHeight.value, currentSnap.value);
  });
  const measurements = createBottomSheetMeasurements({sheetRef, bodyRef});
  const bodyScrollLock = createBodyScrollLock();

  function getMinimumSheetHeight() {
    if (!viewport.isMobileViewport()) return props.minHeight;
    return Math.max(
      props.minHeight,
      measurements.getSheetChromeHeight() + measurements.getMinimumVisibleBodyHeight()
    );
  }

  function clampHeight(height) {
    const viewportHeight = viewport.getViewportHeight();
    const preferredMinHeight = getMinimumSheetHeight();
    const maxHeight = Math.max(
      preferredMinHeight,
      Math.floor(viewportHeight * props.maxRatio) - viewport.getSafeAreaBottom()
    );
    const minHeight = Math.min(preferredMinHeight, maxHeight);
    return Math.min(Math.max(height, minHeight), maxHeight);
  }

  function getContentHeight() {
    return measurements.getSheetChromeHeight() + measurements.getBodyContentHeight() + 8;
  }

  function getInitialHeight() {
    const viewportHeight = viewport.getViewportHeight();
    if (props.initialSnap === 'full') return viewportHeight * props.maxRatio;
    if (props.initialSnap === 'half') return viewportHeight * BOTTOM_SHEET_SNAP_RATIO.half;

    const minimumSheetHeight = getMinimumSheetHeight();
    const contentSnapRatio = viewport.getContentSnapRatio(BOTTOM_SHEET_SNAP_RATIO);
    return Math.max(
      minimumSheetHeight,
      Math.min(getContentHeight(), viewportHeight * contentSnapRatio)
    );
  }

  function setHeight(height, snap = 'custom') {
    currentHeight.value = clampHeight(height);
    currentSnap.value =
      currentHeight.value >=
      viewport.getViewportHeight() * BOTTOM_SHEET_SNAP_RATIO.fullThreshold
        ? 'full'
        : snap;
  }

  function expand() {
    setHeight(viewport.getViewportHeight() * props.maxRatio, 'full');
  }

  function collapse() {
    setHeight(props.minHeight, 'min');
  }

  function measureOpeningHeight() {
    setHeight(getInitialHeight(), props.initialSnap);
  }

  function resetHeight() {
    window.cancelAnimationFrame?.(measureRaf);
    nextTick(() => {
      measureRaf = window.requestAnimationFrame
        ? window.requestAnimationFrame(measureOpeningHeight)
        : window.setTimeout(measureOpeningHeight, 0);
    });
  }

  const drag = createBottomSheetDragController({
    dragging,
    getCurrentHeight: () => currentHeight.value,
    setHeight,
    getViewportHeight: viewport.getViewportHeight,
    expand,
    close: () => emit('close'),
    minHeight: () => props.minHeight,
    ratios: BOTTOM_SHEET_SNAP_RATIO,
  });

  watch(
    () => props.open,
    (isOpen) => {
      if (isOpen) {
        bodyScrollLock.lock();
        resetHeight();
        viewport.register();
      } else {
        bodyScrollLock.unlock();
        viewport.unregister();
      }
    },
    {immediate: true}
  );

  onBeforeUnmount(() => {
    bodyScrollLock.unlock();
    if (measureRaf) window.cancelAnimationFrame?.(measureRaf);
    drag.cleanup();
    viewport.cleanup();
  });

  return {
    sheetRef,
    bodyRef,
    dragging,
    currentSnap,
    sheetStyle,
    startDrag: drag.startDrag,
    expand,
    collapse,
  };
}
