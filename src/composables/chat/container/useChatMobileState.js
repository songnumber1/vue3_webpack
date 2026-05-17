import {ref} from 'vue';
import {addMediaQueryListener} from '@/utils/dom';
import {MOBILE_BREAKPOINT_PX} from '@/constants/uiTokens';

export function useChatMobileState() {
  const isMobile = ref(false);
  let removeMediaQueryListener = null;

  function resolveMobileState() {
    if (typeof window === 'undefined') return false;
    return Boolean(
      window.matchMedia?.(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`)?.matches ||
        window.innerWidth <= MOBILE_BREAKPOINT_PX
    );
  }

  function updateMobileState() {
    isMobile.value = resolveMobileState();
  }

  function startMobileStateWatch() {
    updateMobileState();
    removeMediaQueryListener = addMediaQueryListener(
      `(max-width: ${MOBILE_BREAKPOINT_PX}px)`,
      updateMobileState
    );
    window.addEventListener('resize', updateMobileState, {passive: true});
  }

  function stopMobileStateWatch() {
    removeMediaQueryListener?.();
    removeMediaQueryListener = null;
    window.removeEventListener('resize', updateMobileState);
  }

  return {
    isMobile,
    updateMobileState,
    startMobileStateWatch,
    stopMobileStateWatch,
  };
}
