/**
 * @file useChatSubmit.js
 * @description Chat submit and fake streaming workflow separated from visual components.
 * @author OpenAI
 */

import { nextTick, ref } from "vue";
import { streamText } from "@/utils/fakeStream";
import { createId } from "@/utils/id";

/**
 * Normalizes PromptInput submit payload into a consistent object.
 * @param {string|{text?: string, attachments?: Array}} payload Prompt input payload
 * @returns {{text: string, attachments: Array}} Normalized prompt data
 */
/**
 * normalizePromptPayload 처리 함수입니다.
 * @param {*} payload 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function normalizePromptPayload(payload) {
  if (typeof payload === "string") return { text: payload.trim(), attachments: [] };
  return {
    text: String(payload?.text || "").trim(),
    attachments: Array.isArray(payload?.attachments) ? payload.attachments : []
  };
}

/**
 * Builds the demo assistant response used by the local UI sample.
 * @param {{text: string, attachments: Array}} normalized Normalized prompt payload
 * @returns {string} Assistant response text
 */
/**
 * buildAssistantResponse 처리 함수입니다.
 * @param {*} normalized 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function buildAssistantResponse(normalized) {
  const fileSummary = normalized.attachments.length
    ? `\n\n첨부 파일 ${normalized.attachments.length}개를 함께 받았습니다. 이미지/파일 미리보기와 메시지 액션 영역도 유지됩니다.`
    : "";
  return `요청하신 내용을 Assistant 기준으로 정리해보겠습니다.\n\n- 입력: ${
    normalized.text || "첨부 기반 요청"
  }\n- 현재 화면은 main/chat/shared 라우트를 분리한 구조입니다.\n- shared 라우트는 동일한 메시지 화면을 사용하지만 입력 영역은 읽기 전용 안내로 대체됩니다.\n- 스크롤이 하단이 아닐 때는 맨 아래 이동 버튼이 표시됩니다.${fileSummary}`;
}

/**
 * Provides the send-message workflow for main/chat routes.
 * @param {{router: import('vue-router').Router, route: import('vue-router').RouteLocationNormalizedLoaded, histories: import('vue').Ref<Array>, messages: import('vue').Ref<Array>, setConversation: Function, scrollBottom: Function, renderAfterStream: Function}} options Submit dependencies
 * @returns {{isGenerating: import('vue').Ref<boolean>, handleSubmit: Function}}
 */
export function useChatSubmit(options) {
  const isGenerating = ref(false);

  /**
   * handleSubmit 처리 함수입니다.
   * @param {*} payload 함수 실행에 필요한 입력값입니다.
   * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
   */
  async function handleSubmit(payload) {
    const normalized = normalizePromptPayload(payload);
    if ((!normalized.text && normalized.attachments.length === 0) || isGenerating.value) return;

    let targetHistoryId = Number(options.route.params.id);
    if (options.route.name === "main") {
      targetHistoryId = Date.now();
      options.histories.value.unshift({
        id: targetHistoryId,
        title: normalized.text || "새 채팅",
        preview: normalized.text || "첨부 파일 기반 새 대화"
      });
      options.setConversation(targetHistoryId, []);
      await options.router.push({ name: "chat", params: { id: targetHistoryId } });
      await nextTick();
    }

    const currentMessages = options.messages.value;
    currentMessages.push({
      id: createId("message"),
      role: "user",
      content: normalized.text,
      attachments: normalized.attachments
    });

    const assistantMessage = {
      id: createId("message"),
      role: "assistant",
      content: ""
    };
    currentMessages.push(assistantMessage);
    options.setConversation(targetHistoryId, currentMessages);
    await nextTick();
    await options.scrollBottom({ force: true, stable: true });

    isGenerating.value = true;
    await streamText(
      buildAssistantResponse(normalized),
      (chunk) => {
        assistantMessage.content = chunk;
      },
      { delay: 9 }
    );
    isGenerating.value = false;
    options.setConversation(targetHistoryId, currentMessages);
    await nextTick();
    await options.renderAfterStream();
  }

  return { isGenerating, handleSubmit };
}
