import {computed} from 'vue';
import {addMediaQueryListener} from '@/utils/dom';
import {MOBILE_BREAKPOINT_PX} from '@/constants/uiTokens';
import {usePlatformStore} from '@/stores/platformStore';

/**
 * @description 모바일 UI 여부를 platformStore로 단일화합니다.
 * @returns {*} 모바일 UI 상태와 viewport watch 제어 함수입니다.
 */
export function useChatMobileState() {
  const platformStore = usePlatformStore();
  const isMobile = computed(() => platformStore.isMobileUi);
  let removeMediaQueryListener = null;

  function updateMobileState() {
    platformStore.refreshViewport();
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
