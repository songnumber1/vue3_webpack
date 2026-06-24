/**
 * @file utils/chatHistoryErrorNotifier.js
 * @description 여러 영역에서 공유하는 유틸리티입니다. DOM/Markdown/feedback/viewport 보정 등 공통 처리를 담당합니다.
 */

import {i18n} from "@/i18n/appI18n";
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
    logWarn("[chatHistoryErrorNotifier] 알림 표시 실패:", notifyError);
  } finally {
    if (error) {
      logWarn("[chatHistoryErrorNotifier] 대화방 목록 갱신 실패:", error);
    }
  }
}
