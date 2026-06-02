/**
 * @file utils/chatHistoryErrorNotifier.js
 * @description 여러 영역에서 공유하는 유틸리티입니다. DOM/Markdown/feedback/viewport 보정 등 공통 처리를 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

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
    logWarn("[chatHistoryErrorNotifier] 알림 표시 실패:", notifyError);
  } finally {
    if (error) {
      logWarn("[chatHistoryErrorNotifier] 대화방 목록 갱신 실패:", error);
    }
  }
}
