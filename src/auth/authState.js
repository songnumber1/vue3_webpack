import {useAuthStore} from "@/stores/authStore";
import {resetAppBootstrapState} from "@/composables/app/appBootstrapState";

export function resetAuthStateSafely() {
  resetAppBootstrapState();
  try {
    useAuthStore().resetAuth();
  } catch (_storeError) {
    // Pinia 초기화 전 또는 테스트 환경에서는 부트스트랩 상태만 정리합니다.
  }
}
