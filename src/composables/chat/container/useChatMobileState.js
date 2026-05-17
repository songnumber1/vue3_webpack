import {computed} from 'vue';
import {usePlatformStore} from '@/stores/platformStore';

export function useChatMobileState() {
  const platformStore = usePlatformStore();
  const isMobile = computed(() => platformStore.isMobileUi);

  function updateMobileState() {
    platformStore.refreshViewport();
  }

  function startMobileStateWatch() {
    platformStore.startViewportWatch();
  }

  function stopMobileStateWatch() {
    platformStore.stopViewportWatch();
  }

  return {
    isMobile,
    updateMobileState,
    startMobileStateWatch,
    stopMobileStateWatch,
  };
}
