import {computed} from 'vue';
import {useOverlayStore} from '@/stores/overlayStore';
import {OVERLAY_KEYS} from '@/constants/overlayTypes';

export function useChatOverlayController() {
  const overlayStore = useOverlayStore();

  function overlayModel(key) {
    return computed({
      get: () => overlayStore.isOpen(key),
      set: (value) => {
        if (value) overlayStore.open(key);
        else overlayStore.close(key);
      },
    });
  }

  const assistantSheetOpen = overlayModel(OVERLAY_KEYS.ASSISTANT_SHEET);
  const noticeOpen = overlayModel(OVERLAY_KEYS.NOTICE);
  const personalizationOpen = overlayModel(OVERLAY_KEYS.PERSONALIZATION);
  const languageSheetOpen = overlayModel(OVERLAY_KEYS.LANGUAGE);
  const mobileSettingsOpen = overlayModel(OVERLAY_KEYS.MOBILE_SETTINGS);
  const historyDialogOpen = overlayModel(OVERLAY_KEYS.HISTORY_DIALOG);
  const historyNoticeOpen = overlayModel(OVERLAY_KEYS.HISTORY_NOTICE);

  function openOverlay(key, payload = null) {
    overlayStore.open(key, payload);
  }

  function closeOverlay(key) {
    overlayStore.close(key);
  }

  function setOverlayOpen(key, value, payload = null) {
    if (value) overlayStore.open(key, payload);
    else overlayStore.close(key);
  }

  return {
    overlayStore,
    overlayKeys: OVERLAY_KEYS,
    assistantSheetOpen,
    noticeOpen,
    personalizationOpen,
    languageSheetOpen,
    mobileSettingsOpen,
    historyDialogOpen,
    historyNoticeOpen,
    openOverlay,
    closeOverlay,
    setOverlayOpen,
  };
}
