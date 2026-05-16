/**
 * @file useNavigationViewport.js
 * @description Responsive navigation viewport state shared by sidebar components.
 */

import {onBeforeUnmount, onMounted, ref} from 'vue';
import {addMediaQueryListener} from '@/utils/dom';

/** @returns {boolean} */
function detectMobileNavigation() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia?.('(max-width: 900px)')?.matches ||
      window.innerWidth <= 900 ||
      document.querySelector('.app-container--mobile')
  );
}

/**
 * Tracks whether navigation-only surfaces should use mobile presentation.
 * @returns {{isMobileNavigation: import('vue').Ref<boolean>, syncNavigationViewport: Function}}
 */
export function useNavigationViewport() {
  const isMobileNavigation = ref(false);
  let removeMediaQueryListener = null;

  /** @returns {void} */
  function syncNavigationViewport() {
    isMobileNavigation.value = detectMobileNavigation();
  }

  onMounted(() => {
    syncNavigationViewport();
    removeMediaQueryListener = addMediaQueryListener(
      '(max-width: 900px)',
      syncNavigationViewport
    );
    window.addEventListener('resize', syncNavigationViewport, {passive: true});
  });

  onBeforeUnmount(() => {
    removeMediaQueryListener?.();
    window.removeEventListener('resize', syncNavigationViewport);
  });

  return {isMobileNavigation, syncNavigationViewport};
}
