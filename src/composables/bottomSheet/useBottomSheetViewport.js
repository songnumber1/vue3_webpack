import {
  BOTTOM_SHEET_VIEWPORT_REFRESH_DELAY_MS,
  MOBILE_BREAKPOINT_PX,
} from '@/constants/uiTokens';
import {
  getMobileBrowserFamily,
  getSafeAreaBottom,
  getViewportHeight as readViewportHeight,
  isMobileViewport as readIsMobileViewport,
} from '@/utils/viewport';
import {subscribeKeyboardViewport} from '@/services/mobileKeyboard/mobileKeyboardManager';

export function createBottomSheetViewportController(onRefresh) {
  let viewportTimer = null;
  let registered = false;
  let unsubscribeKeyboard = null;

  function getViewportHeight() {
    return readViewportHeight();
  }

  function isMobileViewport() {
    return readIsMobileViewport(MOBILE_BREAKPOINT_PX);
  }

  function getContentSnapRatio(ratios) {
    return isMobileViewport() && getMobileBrowserFamily() === 'firefox'
      ? ratios.contentFirefox
      : ratios.contentDefault;
  }

  function scheduleViewportRefresh() {
    window.clearTimeout(viewportTimer);
    viewportTimer = window.setTimeout(() => {
      onRefresh?.();
    }, BOTTOM_SHEET_VIEWPORT_REFRESH_DELAY_MS);
  }

  function register() {
    if (registered || typeof window === 'undefined') return;
    window.addEventListener('resize', scheduleViewportRefresh, {passive: true});
    unsubscribeKeyboard = subscribeKeyboardViewport(scheduleViewportRefresh);
    registered = true;
  }

  function unregister() {
    if (!registered || typeof window === 'undefined') return;
    window.removeEventListener('resize', scheduleViewportRefresh);
    unsubscribeKeyboard?.();
    unsubscribeKeyboard = null;
    registered = false;
  }

  function cleanup() {
    window.clearTimeout(viewportTimer);
    unregister();
  }

  return {
    getViewportHeight,
    isMobileViewport,
    getSafeAreaBottom,
    getContentSnapRatio,
    scheduleViewportRefresh,
    register,
    unregister,
    cleanup,
  };
}
