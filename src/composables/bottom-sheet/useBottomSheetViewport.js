import {useEventListener} from "@vueuse/core";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {BOTTOM_SHEET_REFRESH_EVENTS} from "@/platform/viewport/viewportConstants";
import {
  BOTTOM_SHEET_SNAP_RATIO,
  BOTTOM_SHEET_VIEWPORT_REFRESH_DELAY_MS,
  MOBILE_BREAKPOINT_PX,
} from "@/platform/viewport/viewportConstants";
import {
  getViewportHeight as readViewportHeight,
  isMobileViewport as readIsMobileViewport,
} from "@/platform/viewport/viewport";
import {readBottomSheetSafeAreaBottom} from "./useBottomSheetSafeArea";
import {
  DEFAULT_OPTION_HEIGHT_PX,
  DEFAULT_SHEET_CHROME_HEIGHT_PX,
  MIN_VISIBLE_OPTION_COUNT,
} from "./bottomSheetConstants";

/**
 * @description 바텀시트 viewport/크기 계산 전용 유틸을 생성합니다.
 * @param {object} options - 바텀시트 계산에 필요한 props/ref 상태입니다.
 * @param {object} options.props - 바텀시트 props입니다.
 * @param {import('vue').Ref<HTMLElement|null>} options.sheetRef - sheet DOM ref입니다.
 * @param {import('vue').Ref<HTMLElement|null>} options.bodyRef - body DOM ref입니다.
 * @returns {object} viewport 및 높이 계산 함수 묶음입니다.
 */
export function createBottomSheetViewport(options) {
  const {props, sheetRef, bodyRef} = options;

  function getSystemBottomSheetBounds() {
    try {
      const store = useSystemSettingsStore();
      return {
        minHeight: Number(store.bottomSheetMinHeight) || props.minHeight,
        maxHeight: Number(store.bottomSheetMaxHeight) || 0,
      };
    } catch (_error) {
      return {minHeight: props.minHeight, maxHeight: 0};
    }
  }

  function getViewportHeight() {
    return readViewportHeight();
  }

  function isMobileViewport() {
    return readIsMobileViewport(MOBILE_BREAKPOINT_PX);
  }

  function getSheetChromeHeight() {
    const sheet = sheetRef.value;
    if (!sheet) return DEFAULT_SHEET_CHROME_HEIGHT_PX;

    const dragArea = sheet.querySelector(".bottom-sheet-drag-area");
    const header = sheet.querySelector(".bottom-sheet-header");
    const style = window.getComputedStyle(sheet);
    const paddingBottom = Number.parseFloat(style.paddingBottom || "0") || 0;

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
      body?.querySelectorAll?.(".bottom-sheet-option") || []
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
    const paddingTop = Number.parseFloat(style.paddingTop || "0") || 0;
    const paddingBottom = Number.parseFloat(style.paddingBottom || "0") || 0;

    return Math.ceil(contentHeight + paddingTop + paddingBottom);
  }

  function getMinimumSheetHeight() {
    const {minHeight} = getSystemBottomSheetBounds();
    if (!isMobileViewport()) return props.minHeight;
    return Math.max(
      minHeight,
      getSheetChromeHeight() + getMinimumVisibleBodyHeight()
    );
  }

  function clampHeight(height) {
    const viewportHeight = getViewportHeight();
    const preferredMinHeight = getMinimumSheetHeight();
    const systemBounds = getSystemBottomSheetBounds();
    const ratioMaxHeight =
      Math.floor(viewportHeight * props.maxRatio) -
      readBottomSheetSafeAreaBottom();
    const configuredMaxHeight = systemBounds.maxHeight
      ? Math.min(systemBounds.maxHeight, ratioMaxHeight)
      : ratioMaxHeight;
    const maxHeight = Math.max(preferredMinHeight, configuredMaxHeight);
    const minHeight = Math.min(preferredMinHeight, maxHeight);
    return Math.min(Math.max(height, minHeight), maxHeight);
  }

  function getContentHeight() {
    return getSheetChromeHeight() + getBodyContentHeight() + 8;
  }

  function getInitialHeight() {
    const viewportHeight = getViewportHeight();
    if (props.initialSnap === "full") return viewportHeight * props.maxRatio;
    if (props.initialSnap === "half") {
      return viewportHeight * BOTTOM_SHEET_SNAP_RATIO.half;
    }

    const minimumSheetHeight = getMinimumSheetHeight();
    const contentHeight = getContentHeight();
    const contentSnapRatio = BOTTOM_SHEET_SNAP_RATIO.contentDefault;

    return Math.max(
      minimumSheetHeight,
      Math.min(contentHeight, viewportHeight * contentSnapRatio)
    );
  }

  return {
    clampHeight,
    getInitialHeight,
    getMinimumSheetHeight,
    getViewportHeight,
    isMobileViewport,
  };
}

/**
 * @description 바텀시트가 열려 있는 동안 viewport 변화를 감시하는 리스너를 관리합니다.
 * @param {Function} scheduleViewportRefresh - viewport 변경 시 실행할 예약 함수입니다.
 * @returns {object} register/unregister 함수입니다.
 */
export function createBottomSheetViewportListeners(scheduleViewportRefresh) {
  let stopWindowEvents = [];
  let stopVisualViewportResize = null;
  let stopVisualViewportScroll = null;

  function registerViewportListeners() {
    if (stopWindowEvents.length) return;
    stopWindowEvents = BOTTOM_SHEET_REFRESH_EVENTS.map((eventName) =>
      useEventListener(window, eventName, scheduleViewportRefresh, {
        passive: true,
      })
    );
    if (window.visualViewport) {
      stopVisualViewportResize = useEventListener(
        window.visualViewport,
        "resize",
        scheduleViewportRefresh,
        {passive: true}
      );
      stopVisualViewportScroll = useEventListener(
        window.visualViewport,
        "scroll",
        scheduleViewportRefresh,
        {passive: true}
      );
    }
  }

  function unregisterViewportListeners() {
    stopWindowEvents.forEach((stop) => stop?.());
    stopVisualViewportResize?.();
    stopVisualViewportScroll?.();
    stopWindowEvents = [];
    stopVisualViewportResize = null;
    stopVisualViewportScroll = null;
  }

  return {
    registerViewportListeners,
    unregisterViewportListeners,
  };
}

/**
 * @description viewport 새로고침 타이머를 기존 지연 시간과 동일하게 관리합니다.
 * @param {object} options - 예약 실행에 필요한 상태입니다.
 * @param {object} options.props - 바텀시트 props입니다.
 * @param {import('vue').Ref<number>} options.currentHeight - 현재 높이 ref입니다.
 * @param {import('vue').Ref<string>} options.currentSnap - 현재 snap ref입니다.
 * @param {Function} options.setHeight - 높이 적용 함수입니다.
 * @returns {object} schedule/clear 함수입니다.
 */
export function createBottomSheetViewportScheduler(options) {
  const {props, currentHeight, currentSnap, setHeight} = options;
  let viewportTimer = null;
  let viewportFrame = null;

  function applyViewportRefresh() {
    if (!props.open) return;
    setHeight(currentHeight.value, currentSnap.value);
  }

  function scheduleViewportRefresh() {
    window.clearTimeout(viewportTimer);
    if (viewportFrame !== null) window.cancelAnimationFrame(viewportFrame);

    if (window.requestAnimationFrame) {
      viewportFrame = window.requestAnimationFrame(() => {
        viewportFrame = null;
        applyViewportRefresh();
      });
    }

    viewportTimer = window.setTimeout(
      applyViewportRefresh,
      BOTTOM_SHEET_VIEWPORT_REFRESH_DELAY_MS
    );
  }

  function clearViewportRefresh() {
    window.clearTimeout(viewportTimer);
    viewportTimer = null;
    if (viewportFrame !== null) window.cancelAnimationFrame?.(viewportFrame);
    viewportFrame = null;
  }

  return {
    clearViewportRefresh,
    scheduleViewportRefresh,
  };
}
