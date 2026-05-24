import {i18n} from "@/i18n";
import {showToastByPlatform} from "@/platform/bridge/platformBridge";
import {usePlatformStore} from "@/stores/platformStore";
import {shouldUseMobileFeedbackChannel} from "@/utils/appFeedback";
import {logWarn} from "@/utils/logger";

export function getChatHistorySyncFailMessage() {
  return i18n.global.t("chat.historySync.loadFailed");
}

export async function notifyChatHistorySyncFailed(error) {
  const message = getChatHistorySyncFailMessage();
  const platformStore = usePlatformStore();
  const platformInfo = platformStore.info || {};

  try {
    if (shouldUseMobileFeedbackChannel(platformInfo)) {
      await showToastByPlatform(message, {
        title: i18n.global.t("toastNote.title"),
      });
      return;
    }

    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(message);
    }
  } catch (notifyError) {
    logWarn("[chatHistorySyncFeedback] 알림 표시 실패:", notifyError);
  } finally {
    if (error) {
      logWarn("[chatHistorySyncFeedback] 대화방 목록 갱신 실패:", error);
    }
  }
}
