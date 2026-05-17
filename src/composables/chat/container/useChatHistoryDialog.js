import {computed, ref} from "vue";

export function useChatHistoryDialog({
  t,
  router,
  messages,
  activeHistoryId,
  toggleHistoryBookmark,
  renameHistory,
  removeHistory,
}) {
  const historyDialogOpen = ref(false);
  const historyDialogMode = ref("rename");
  const historyDialogTarget = ref(null);
  const historyNoticeOpen = ref(false);
  const historyNoticeMessage = ref("");

  const historyDialogTitle = computed(() =>
    historyDialogMode.value === "delete"
      ? t("chat.historyDialog.deleteTitle")
      : t("chat.historyDialog.renameTitle")
  );
  const historyDialogMessage = computed(() =>
    historyDialogMode.value === "delete"
      ? t("chat.historyDialog.deleteMessage", {
          title:
            historyDialogTarget.value?.title ||
            t("chat.historyDialog.selectedConversation"),
        })
      : ""
  );

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
    if (historyDialogMode.value === "rename") {
      const nextTitle = String(value || "").trim();
      if (!nextTitle) return;
      await renameHistory(target, nextTitle);
    } else if (historyDialogMode.value === "delete") {
      await removeHistory(target);
      if (String(activeHistoryId.value) === String(target.id)) {
        messages.value = [];
        await router.replace("/");
      }
    }
    closeHistoryDialog();
  }

  async function handleHistoryMenuAction({action, history} = {}) {
    if (!history || !action) return;
    if (action === "pin" || action === "unpin") {
      await toggleHistoryBookmark(history);
      return;
    }
    if (action === "rename") {
      historyDialogTarget.value = history;
      historyDialogMode.value = "rename";
      historyDialogOpen.value = true;
      return;
    }
    if (action === "share") {
      historyNoticeMessage.value = t("chat.historyDialog.shareSelected");
      historyNoticeOpen.value = true;
      return;
    }
    if (action === "delete") {
      historyDialogTarget.value = history;
      historyDialogMode.value = "delete";
      historyDialogOpen.value = true;
    }
  }

  return {
    historyDialogOpen,
    historyDialogMode,
    historyDialogTarget,
    historyDialogTitle,
    historyDialogMessage,
    historyNoticeOpen,
    historyNoticeMessage,
    closeHistoryDialog,
    confirmHistoryDialog,
    handleHistoryMenuAction,
  };
}
