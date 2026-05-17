import {computed, nextTick, onBeforeUnmount, ref, watch} from 'vue';
import {useEventListener, useScrollLock} from '@vueuse/core';
import {
  BOTTOM_SHEET_SNAP_RATIO,
  BOTTOM_SHEET_VIEWPORT_REFRESH_DELAY_MS,
  MOBILE_BREAKPOINT_PX,
} from '@/constants/uiTokens';
import {
// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
  getMobileBrowserFamily,
  getSafeAreaBottom,
  getViewportHeight as readViewportHeight,
  isMobileViewport as readIsMobileViewport,
} from '@/utils/viewport';

const MIN_VISIBLE_OPTION_COUNT = 3;
const DEFAULT_OPTION_HEIGHT_PX = 58;
const DEFAULT_SHEET_CHROME_HEIGHT_PX = 122;

/**
 * @description useBottomSheetSizing 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} props - props 입력값입니다.
 * @param {*} emit - emit 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function useBottomSheetSizing(props, emit) {
  const sheetRef = ref(null);
  const bodyRef = ref(null);
  const dragging = ref(false);
  const currentHeight = ref(320);
  const currentSnap = ref('content');

  let dragStartY = 0;
  let dragStartHeight = 0;
  const bodyScrollLocked =
    typeof document === 'undefined' ? ref(false) : useScrollLock(document.body);
  let viewportTimer = null;
  let measureRaf = 0;
  let stopPointerMove = null;
  let stopPointerUp = null;
  let stopPointerCancel = null;
  let stopViewportResize = null;
  let stopVisualViewportResize = null;
  let stopVisualViewportScroll = null;

  const sheetStyle = computed(() => ({
    '--bottom-sheet-height': `${Math.round(currentHeight.value)}px`,
  }));

  /**
   * @description getViewportHeight 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function getViewportHeight() {
    // 계산된 결과를 호출부로 반환합니다.
    return readViewportHeight();
  }

  /**
   * @description isMobileViewport 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function isMobileViewport() {
    // 계산된 결과를 호출부로 반환합니다.
    return readIsMobileViewport(MOBILE_BREAKPOINT_PX);
  }

  /**
   * @description getSheetChromeHeight 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function getSheetChromeHeight() {
    const sheet = sheetRef.value;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!sheet) return DEFAULT_SHEET_CHROME_HEIGHT_PX;

    const dragArea = sheet.querySelector('.bottom-sheet-drag-area');
    const header = sheet.querySelector('.bottom-sheet-header');
    const style = window.getComputedStyle(sheet);
    const paddingBottom = Number.parseFloat(style.paddingBottom || '0') || 0;

    // 계산된 결과를 호출부로 반환합니다.
    return Math.ceil(
      (dragArea?.getBoundingClientRect().height || 28) +
        (header?.getBoundingClientRect().height || 50) +
        paddingBottom +
        18
    );
  }

  /**
   * @description getMinimumVisibleBodyHeight 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function getMinimumVisibleBodyHeight() {
    const body = bodyRef.value;
    const options = Array.from(
      body?.querySelectorAll?.('.bottom-sheet-option') || []
    );

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!options.length) {
      // 계산된 결과를 호출부로 반환합니다.
      return DEFAULT_OPTION_HEIGHT_PX * MIN_VISIBLE_OPTION_COUNT;
    }

    const totalOptionHeight = options
      .slice(0, MIN_VISIBLE_OPTION_COUNT)
      .reduce((sum, option) => {
        const height = option.getBoundingClientRect().height;
        // 계산된 결과를 호출부로 반환합니다.
        return sum + (height > 0 ? height : DEFAULT_OPTION_HEIGHT_PX);
      }, 0);

    // 계산된 결과를 호출부로 반환합니다.
    return Math.ceil(totalOptionHeight + 12);
  }

  /**
   * @description getBodyContentHeight 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function getBodyContentHeight() {
    const body = bodyRef.value;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!body) return 0;

    const children = Array.from(body.children || []);
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!children.length) return body.scrollHeight || 0;

    const contentHeight = children.reduce((sum, child) => {
      const height = child.getBoundingClientRect().height;
      // 계산된 결과를 호출부로 반환합니다.
      return sum + (height > 0 ? height : child.scrollHeight || 0);
    }, 0);

    const style = window.getComputedStyle(body);
    const paddingTop = Number.parseFloat(style.paddingTop || '0') || 0;
    const paddingBottom = Number.parseFloat(style.paddingBottom || '0') || 0;

    // 계산된 결과를 호출부로 반환합니다.
    return Math.ceil(contentHeight + paddingTop + paddingBottom);
  }

  /**
   * @description getMinimumSheetHeight 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function getMinimumSheetHeight() {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!isMobileViewport()) return props.minHeight;
    // 계산된 결과를 호출부로 반환합니다.
    return Math.max(
      props.minHeight,
      getSheetChromeHeight() + getMinimumVisibleBodyHeight()
    );
  }

  /**
   * @description clampHeight 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} height - height 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function clampHeight(height) {
    const viewportHeight = getViewportHeight();
    const preferredMinHeight = getMinimumSheetHeight();
    const maxHeight = Math.max(
      preferredMinHeight,
      Math.floor(viewportHeight * props.maxRatio) - getSafeAreaBottom()
    );
    const minHeight = Math.min(preferredMinHeight, maxHeight);
    // 계산된 결과를 호출부로 반환합니다.
    return Math.min(Math.max(height, minHeight), maxHeight);
  }

  /**
   * @description getContentHeight 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function getContentHeight() {
    // 계산된 결과를 호출부로 반환합니다.
    return getSheetChromeHeight() + getBodyContentHeight() + 8;
  }

  /**
   * @description getInitialHeight 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function getInitialHeight() {
    const viewportHeight = getViewportHeight();
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (props.initialSnap === 'full') return viewportHeight * props.maxRatio;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (props.initialSnap === 'half') return viewportHeight * BOTTOM_SHEET_SNAP_RATIO.half;

    const minimumSheetHeight = getMinimumSheetHeight();
    const contentHeight = getContentHeight();
    const contentSnapRatio =
      isMobileViewport() && getMobileBrowserFamily() === 'firefox'
        ? BOTTOM_SHEET_SNAP_RATIO.contentFirefox
        : BOTTOM_SHEET_SNAP_RATIO.contentDefault;

    // 계산된 결과를 호출부로 반환합니다.
    return Math.max(
      minimumSheetHeight,
      Math.min(contentHeight, viewportHeight * contentSnapRatio)
    );
  }

  /**
   * @description setHeight 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} height - height 입력값입니다.
   * @param {*} snap - snap 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function setHeight(height, snap = 'custom') {
    currentHeight.value = clampHeight(height);
    currentSnap.value =
      currentHeight.value >= getViewportHeight() * BOTTOM_SHEET_SNAP_RATIO.fullThreshold
        ? 'full'
        : snap;
  }

  /**
   * @description expand 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function expand() {
    setHeight(getViewportHeight() * props.maxRatio, 'full');
  }

  /**
   * @description collapse 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function collapse() {
    setHeight(props.minHeight, 'min');
  }

  /**
   * @description measureOpeningHeight 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function measureOpeningHeight() {
    setHeight(getInitialHeight(), props.initialSnap);
  }

  /**
   * @description resetHeight 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function resetHeight() {
    window.cancelAnimationFrame?.(measureRaf);
    nextTick(() => {
      measureRaf = window.requestAnimationFrame
        ? window.requestAnimationFrame(measureOpeningHeight)
        : window.setTimeout(measureOpeningHeight, 0);
    });
  }

  /**
   * @description lockBodyScroll 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function lockBodyScroll() {
    bodyScrollLocked.value = true;
  }

  /**
   * @description unlockBodyScroll 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function unlockBodyScroll() {
    bodyScrollLocked.value = false;
  }

  /**
   * @description startDrag 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} event - event 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function startDrag(event) {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!event.isPrimary && event.pointerType !== 'mouse') return;
    dragging.value = true;
    dragStartY = event.clientY;
    dragStartHeight = currentHeight.value;
    event.currentTarget?.setPointerCapture?.(event.pointerId);
    stopPointerMove = useEventListener(window, 'pointermove', handleDrag, {passive: false});
    stopPointerUp = useEventListener(window, 'pointerup', stopDrag, {passive: true});
    stopPointerCancel = useEventListener(window, 'pointercancel', stopDrag, {passive: true});
  }

  /**
   * @description handleDrag 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} event - event 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function handleDrag(event) {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!dragging.value) return;
    event.preventDefault();
    const delta = dragStartY - event.clientY;
    setHeight(dragStartHeight + delta);
  }

  /**
   * @description stopDrag 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function stopDrag() {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!dragging.value) return;
    dragging.value = false;
    stopPointerMove?.();
    stopPointerUp?.();
    stopPointerCancel?.();
    stopPointerMove = null;
    stopPointerUp = null;
    stopPointerCancel = null;

    const viewportHeight = getViewportHeight();
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (currentHeight.value > viewportHeight * BOTTOM_SHEET_SNAP_RATIO.expandThreshold) expand();
    else if (currentHeight.value < props.minHeight * BOTTOM_SHEET_SNAP_RATIO.closeThreshold) emit('close');
  }

  /**
   * @description scheduleViewportRefresh 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function scheduleViewportRefresh() {
    window.clearTimeout(viewportTimer);
    viewportTimer = window.setTimeout(() => {
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (!props.open) return;
      setHeight(currentHeight.value, currentSnap.value);
    }, BOTTOM_SHEET_VIEWPORT_REFRESH_DELAY_MS);
  }

  /**
   * @description 바텀시트가 열려 있는 동안 필요한 viewport 리스너를 한 번만 등록합니다.
   * @returns {void} 이미 등록된 경우 중복 등록하지 않습니다.
   */
  function registerViewportListeners() {
    if (stopViewportResize) return;
    stopViewportResize = useEventListener(window, 'resize', scheduleViewportRefresh, {
      passive: true,
    });
    if (window.visualViewport) {
      stopVisualViewportResize = useEventListener(
        window.visualViewport,
        'resize',
        scheduleViewportRefresh,
        {passive: true}
      );
      stopVisualViewportScroll = useEventListener(
        window.visualViewport,
        'scroll',
        scheduleViewportRefresh,
        {passive: true}
      );
    }
  }

  /**
   * @description 바텀시트 viewport 리스너를 안전하게 해제합니다.
   * @returns {void} 등록된 리스너가 있을 때만 해제합니다.
   */
  function unregisterViewportListeners() {
    stopViewportResize?.();
    stopVisualViewportResize?.();
    stopVisualViewportScroll?.();
    stopViewportResize = null;
    stopVisualViewportResize = null;
    stopVisualViewportScroll = null;
  }

  // Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
  watch(
    () => props.open,
    (isOpen) => {
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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

  // Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
  onBeforeUnmount(() => {
    unlockBodyScroll();
    window.clearTimeout(viewportTimer);
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (measureRaf) window.cancelAnimationFrame?.(measureRaf);
    stopPointerMove?.();
    stopPointerUp?.();
    stopPointerCancel?.();
    stopPointerMove = null;
    stopPointerUp = null;
    stopPointerCancel = null;
    unregisterViewportListeners();
  });

  // 계산된 결과를 호출부로 반환합니다.
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
