/**
 * @file composables/chat/internal/container/useChatMermaidHistoryGuards.js
 * @description history 메시지의 Mermaid 렌더 필요 여부를 판단합니다.
 */

import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";

export function useChatMermaidHistoryGuards({systemSettingsStore, isMobile}) {
  function isMermaidRenderingEnabled() {
    return isMermaidRenderingEnabledForPlatform(
      systemSettingsStore.settings,
      Boolean(isMobile?.value)
    );
  }

  function hasMermaidInHistoryMessages(sourceMessages = []) {
    if (!isMermaidRenderingEnabled()) return false;
    const list = Array.isArray(sourceMessages) ? sourceMessages : [];
    return list.some((message) => {
      const content = `${message?.content || ""}\n${message?.reasoningContent || ""}`;
      return /```\s*mermaid/i.test(content);
    });
  }

  return {
    isMermaidRenderingEnabled,
    hasMermaidInHistoryMessages,
  };
}
