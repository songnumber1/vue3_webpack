import {ref} from 'vue';

/**
 * @description ChatContainer에서 사용하는 공통 overlay/sheet open 상태를 한 곳에서 관리합니다.
 * @returns {*} overlay 상태와 open/close 핸들러입니다.
 */
export function useChatOverlayController() {
  const assistantSheetOpen = ref(false);
  const noticeOpen = ref(false);
  const personalizationOpen = ref(false);
  const languageSheetOpen = ref(false);
  const mobileSettingsOpen = ref(false);

  function closePrimaryOverlays() {
    noticeOpen.value = false;
    personalizationOpen.value = false;
    languageSheetOpen.value = false;
    mobileSettingsOpen.value = false;
  }

  return {
    assistantSheetOpen,
    noticeOpen,
    personalizationOpen,
    languageSheetOpen,
    mobileSettingsOpen,
    closePrimaryOverlays,
  };
}
