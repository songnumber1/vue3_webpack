/**
 * @file useBottomSheetSizing.js
 * @description Bottom sheet height and drag behavior. Uses a single coalesced measurement per frame instead of repeated nested reflows.
 */

import {computed, nextTick, onBeforeUnmount, ref, watch} from 'vue';
import {
  getMobileBrowserFamily,
  getSafeAreaBottom,
  getViewportHeight as readViewportHeight,
  isMobileViewport as readIsMobileViewport,
} from '@/utils/viewport';

const MOBILE_BREAKPOINT_PX = 900;
const MIN_VISIBLE_OPTION_COUNT = 3;
const DEFAULT_OPTION_HEIGHT_PX = 58;
const DEFAULT_SHEET_CHROME_HEIGHT_PX = 122;

/**
 * Manages bottom sheet layout, dragging and viewport refresh.
 * @param {object} props BaseBottomSheet props.
 * @param {Function} emit Component emit function.
 * @returns {object} Bottom sheet controller API.
 */
export function useBottomSheetSizing(props, emit) {
  const sheetRef = ref(null);
  const bodyRef = ref(null);
  const dragging = ref(false);
  const currentHeight = ref(320);
  const currentSnap = ref('content');

  let dragStartY = 0;
  let dragStartHeight = 0;
  let previousBodyOverflow = '';
  let viewportTimer = null;
  let measureRaf = 0;

  const sheetStyle = computed(() => ({
    '--bottom-sheet-height': `${Math.round(currentHeight.value)}px`,
  }));

  function getViewportHeight() {
    return readViewportHeight();
  }

  function isMobileViewport() {
    return readIsMobileViewport(MOBILE_BREAKPOINT_PX);
  }

  function getSheetChromeHeight() {
    const sheet = sheetRef.value;
    if (!sheet) return DEFAULT_SHEET_CHROME_HEIGHT_PX;

    const dragArea = sheet.querySelector('.bottom-sheet-drag-area');
    const header = sheet.querySelector('.bottom-sheet-header');
    const style = window.getComputedStyle(sheet);
    const paddingBottom = Number.parseFloat(style.paddingBottom || '0') || 0;

    return Math.ceil(
      (dragArea?.getBoundingClientRect().height || 28) +
        (header?.getBoundingClientRect().height || 50) +
        paddingBottom +
        18
    );
  }

  function getMinimumVisibleBodyHeight() {
    const body = bodyRef.value;
    const options = Array.from(
      body?.querySelectorAll?.('.bottom-sheet-option') || []
    );

    if (!options.length) {
      return DEFAULT_OPTION_HEIGHT_PX * MIN_VISIBLE_OPTION_COUNT;
    }

    const totalOptionHeight = options
      .slice(0, MIN_VISIBLE_OPTION_COUNT)
      .reduce((sum, option) => {
        const height = option.getBoundingClientRect().height;
        return sum + (height > 0 ? height : DEFAULT_OPTION_HEIGHT_PX);
      }, 0);

    return Math.ceil(totalOptionHeight + 12);
  }

  function getBodyContentHeight() {
    const body = bodyRef.value;
    if (!body) return 0;

    const children = Array.from(body.children || []);
    if (!children.length) return body.scrollHeight || 0;

    const contentHeight = children.reduce((sum, child) => {
      const height = child.getBoundingClientRect().height;
      return sum + (height > 0 ? height : child.scrollHeight || 0);
    }, 0);

    const style = window.getComputedStyle(body);
    const paddingTop = Number.parseFloat(style.paddingTop || '0') || 0;
    const paddingBottom = Number.parseFloat(style.paddingBottom || '0') || 0;

    return Math.ceil(contentHeight + paddingTop + paddingBottom);
  }

  function getMinimumSheetHeight() {
    if (!isMobileViewport()) return props.minHeight;
    return Math.max(
      props.minHeight,
      getSheetChromeHeight() + getMinimumVisibleBodyHeight()
    );
  }

  function clampHeight(height) {
    const viewportHeight = getViewportHeight();
    const preferredMinHeight = getMinimumSheetHeight();
    const maxHeight = Math.max(
      preferredMinHeight,
      Math.floor(viewportHeight * props.maxRatio) - getSafeAreaBottom()
    );
    const minHeight = Math.min(preferredMinHeight, maxHeight);
    return Math.min(Math.max(height, minHeight), maxHeight);
  }

  function getContentHeight() {
    return getSheetChromeHeight() + getBodyContentHeight() + 8;
  }

  function getInitialHeight() {
    const viewportHeight = getViewportHeight();
    if (props.initialSnap === 'full') return viewportHeight * props.maxRatio;
    if (props.initialSnap === 'half') return viewportHeight * 0.58;

    const minimumSheetHeight = getMinimumSheetHeight();
    const contentHeight = getContentHeight();
    const contentSnapRatio =
      isMobileViewport() && getMobileBrowserFamily() === 'firefox' ? 0.64 : 0.72;

    return Math.max(
      minimumSheetHeight,
      Math.min(contentHeight, viewportHeight * contentSnapRatio)
    );
  }

  function setHeight(height, snap = 'custom') {
    currentHeight.value = clampHeight(height);
    currentSnap.value =
      currentHeight.value >= getViewportHeight() * 0.82 ? 'full' : snap;
  }

  function expand() {
    setHeight(getViewportHeight() * props.maxRatio, 'full');
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

  function lockBodyScroll() {
    if (typeof document === 'undefined') return;
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  function unlockBodyScroll() {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = previousBodyOverflow;
  }

  function startDrag(event) {
    if (!event.isPrimary && event.pointerType !== 'mouse') return;
    dragging.value = true;
    dragStartY = event.clientY;
    dragStartHeight = currentHeight.value;
    event.currentTarget?.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', handleDrag, {passive: false});
    window.addEventListener('pointerup', stopDrag, {passive: true});
    window.addEventListener('pointercancel', stopDrag, {passive: true});
  }

  function handleDrag(event) {
    if (!dragging.value) return;
    event.preventDefault();
    const delta = dragStartY - event.clientY;
    setHeight(dragStartHeight + delta);
  }

  function stopDrag() {
    if (!dragging.value) return;
    dragging.value = false;
    window.removeEventListener('pointermove', handleDrag);
    window.removeEventListener('pointerup', stopDrag);
    window.removeEventListener('pointercancel', stopDrag);

    const viewportHeight = getViewportHeight();
    if (currentHeight.value > viewportHeight * 0.76) expand();
    else if (currentHeight.value < props.minHeight * 0.82) emit('close');
  }

  function scheduleViewportRefresh() {
    window.clearTimeout(viewportTimer);
    viewportTimer = window.setTimeout(() => {
      if (!props.open) return;
      setHeight(currentHeight.value, currentSnap.value);
    }, 60);
  }

  watch(
    () => props.open,
    (isOpen) => {
      if (isOpen) {
        lockBodyScroll();
        resetHeight();
        window.addEventListener('resize', scheduleViewportRefresh, {
          passive: true,
        });
        window.visualViewport?.addEventListener(
          'resize',
          scheduleViewportRefresh,
          {passive: true}
        );
        window.visualViewport?.addEventListener(
          'scroll',
          scheduleViewportRefresh,
          {passive: true}
        );
      } else {
        unlockBodyScroll();
        window.removeEventListener('resize', scheduleViewportRefresh);
        window.visualViewport?.removeEventListener(
          'resize',
          scheduleViewportRefresh
        );
        window.visualViewport?.removeEventListener(
          'scroll',
          scheduleViewportRefresh
        );
      }
    },
    {immediate: true}
  );

  onBeforeUnmount(() => {
    unlockBodyScroll();
    window.clearTimeout(viewportTimer);
    if (measureRaf) window.cancelAnimationFrame?.(measureRaf);
    window.removeEventListener('pointermove', handleDrag);
    window.removeEventListener('pointerup', stopDrag);
    window.removeEventListener('pointercancel', stopDrag);
    window.removeEventListener('resize', scheduleViewportRefresh);
    window.visualViewport?.removeEventListener('resize', scheduleViewportRefresh);
    window.visualViewport?.removeEventListener('scroll', scheduleViewportRefresh);
  });

  return {
    sheetRef,
    bodyRef,
    dragging,
    currentSnap,
    sheetStyle,
    startDrag,
    expand,
    collapse,
  };
}
