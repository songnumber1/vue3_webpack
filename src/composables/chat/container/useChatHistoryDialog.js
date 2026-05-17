import {computed, ref} from 'vue';

export function useChatHistoryDialog({t, activeHistoryId, messages, router, renameHistory, removeHistory}) {
  const historyDialogOpen = ref(false);
  const historyDialogMode = ref('rename');
  const historyDialogTarget = ref(null);
  const historyNoticeOpen = ref(false);
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

  function openRenameDialog(history) {
    historyDialogTarget.value = history;
    historyDialogMode.value = 'rename';
    historyDialogOpen.value = true;
  }

  function openDeleteDialog(history) {
    historyDialogTarget.value = history;
    historyDialogMode.value = 'delete';
    historyDialogOpen.value = true;
  }

  function openNotice(message) {
    historyNoticeMessage.value = message;
    historyNoticeOpen.value = true;
  }

  function closeHistoryDialog() {
    historyDialogOpen.value = false;
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
    historyDialogOpen,
    historyDialogMode,
    historyDialogTarget,
    historyNoticeOpen,
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
