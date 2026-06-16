/**
 * @file composables/main/useMainPromptState.js
 * @description 메인 화면 PromptComposer에 필요한 표시 상태를 제공합니다.
 */

import {computed} from "vue";

export function useMainPromptState({isMobile} = {}) {
  const mainPromptClass = computed(() =>
    isMobile?.value
      ? "mobile-keyboard-dock mobile-keyboard-dock--fixed mobile-main-fixed-prompt main-empty-state__prompt tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-prompt tw-box-border tw-w-[100dvw] tw-max-w-[100dvw] tw-overflow-hidden tw-bg-transparent tw-px-3 tw-pb-[max(12px,env(safe-area-inset-bottom))] tw-pt-2 tw-shadow-none"
      : "desktop-center-prompt tw-w-[min(var(--layout-prompt-width,880px),100%)] tw-max-w-[var(--layout-prompt-width,880px)] tw-border-0 tw-p-0"
  );

  return {
    mainPromptClass,
  };
}
