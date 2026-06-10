import {clearTokens} from "@/auth/tokenStore";
import {useAuthStore} from "@/stores/authStore";
import {resetAppBootstrapState} from "@/composables/app/useAppBootstrap";

export function resetAuthStateSafely() {
  clearTokens();
  resetAppBootstrapState();
  try {
    useAuthStore().resetAuth();
  } catch (_storeError) {
    // Pinia 초기화 전 또는 테스트 환경에서는 토큰 정리만 수행합니다.
  }
}
