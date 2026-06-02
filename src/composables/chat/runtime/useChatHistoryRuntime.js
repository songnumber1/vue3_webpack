import {
  deleteChatHistory,
  loadChatHistoryList,
  renameChatHistory,
  updateChatBookmark,
} from "@/composables/app/chatRuntimeBootstrap";
import {logWarn} from "@/utils/logger";
import {notifyChatHistorySyncFailed} from "@/utils/chatHistoryErrorNotifier";

export function createChatHistoryRuntime({assistantStore, chatStore}) {
  async function refreshHistories({notifyOnError = false} = {}) {
    try {
      const chatHistories = await loadChatHistoryList({
        assistantMap: assistantStore.assistantMap,
        modelMap: assistantStore.modelMap,
      });
      chatStore.setHistories(chatHistories);
      return chatHistories;
    } catch (error) {
      logWarn("[useChatRuntime] refreshHistories 오류:", error);
      if (notifyOnError) await notifyChatHistorySyncFailed(error);
      return chatStore.histories;
    }
  }

  function syncHistoriesInBackground(options = {}) {
    Promise.resolve()
      .then(() => refreshHistories(options))
      .catch((error) => {
        logWarn("[useChatRuntime] syncHistoriesInBackground 오류:", error);
      });
  }

  async function toggleHistoryBookmark(history) {
    if (!history?.id) return;
    try {
      syncHistoriesInBackground({notifyOnError: true});
      await updateChatBookmark({
        chatId: history.id,
        bookmarkYN: !history.isPinned,
      });
      syncHistoriesInBackground({notifyOnError: true});
    } catch (error) {
      logWarn("[useChatRuntime] toggleHistoryBookmark 오류:", error);
      throw error;
    }
  }

  async function renameHistory(history, title) {
    const chatTitle = String(title || "").trim();
    if (!history?.id || !chatTitle) return;
    try {
      syncHistoriesInBackground({notifyOnError: true});
      await renameChatHistory({chatId: history.id, chatTitle});
      syncHistoriesInBackground({notifyOnError: true});
    } catch (error) {
      logWarn("[useChatRuntime] renameHistory 오류:", error);
      throw error;
    }
  }

  async function removeHistory(history) {
    if (!history?.id) return;
    try {
      syncHistoriesInBackground({notifyOnError: true});
      await deleteChatHistory({chatId: history.id});
      delete chatStore.messageMap[history.id];

      if (String(chatStore.selectedChatId) === String(history.id)) {
        chatStore.clearActiveSession();
      }
      syncHistoriesInBackground({notifyOnError: true});
    } catch (error) {
      logWarn("[useChatRuntime] removeHistory 오류:", error);
      throw error;
    }
  }

  return {
    refreshHistories,
    syncHistoriesInBackground,
    toggleHistoryBookmark,
    renameHistory,
    removeHistory,
  };
}
