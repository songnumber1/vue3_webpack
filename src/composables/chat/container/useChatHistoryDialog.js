import {computed, ref} from 'vue';

export function useChatHistoryDialog({
  t,
  activeHistoryId,
  messages,
  router,
  renameHistory,
  removeHistory,
  openOverlay,
  closeOverlay,
  overlayKeys,
}) {
  const historyDialogMode = ref('rename');
  const historyDialogTarget = ref(null);
  const historyNoticeMessage = ref('');

  const historyDialogTitle = computed(() =>
    historyDialogMode.value === 'delete'
      ? t('chat.historyMenu.deleteTitle')
      : t('chat.historyMenu.renameTitle')
  );

  const historyDialogMessage = computed(() => {
    if (historyDialogMode.value !== 'delete') return '';
    const title =
      historyDialogTarget.value?.title || t('chat.historyMenu.deleteDefaultTitle');
    return t('chat.historyMenu.deleteMessage', {title});
  });

  function openHistoryDialog(mode, history) {
    historyDialogTarget.value = history;
    historyDialogMode.value = mode;
    openOverlay(overlayKeys.HISTORY_DIALOG);
  }

  function openRenameDialog(history) {
    openHistoryDialog('rename', history);
  }

  function openDeleteDialog(history) {
    openHistoryDialog('delete', history);
  }

  function openNotice(message) {
    historyNoticeMessage.value = message;
    openOverlay(overlayKeys.HISTORY_NOTICE);
  }

  function closeHistoryDialog() {
    closeOverlay(overlayKeys.HISTORY_DIALOG);
    historyDialogTarget.value = null;
  }

  async function confirmHistoryDialog(value) {
    const target = historyDialogTarget.value;
    if (!target) {
      closeHistoryDialog();
      return;
    }

    if (historyDialogMode.value === 'rename') {
      const nextTitle = String(value || '').trim();
      if (!nextTitle) return;
      await renameHistory(target, nextTitle);
    } else if (historyDialogMode.value === 'delete') {
      await removeHistory(target);
      if (String(activeHistoryId.value) === String(target.id)) {
        messages.value = [];
        await router.replace('/');
      }
    }

    closeHistoryDialog();
  }

  return {
    historyDialogMode,
    historyDialogTarget,
    historyNoticeMessage,
    historyDialogTitle,
    historyDialogMessage,
    openRenameDialog,
    openDeleteDialog,
    openNotice,
    closeHistoryDialog,
    confirmHistoryDialog,
  };
}
