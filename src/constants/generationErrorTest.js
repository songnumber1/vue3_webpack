export const GENERATION_ERROR_TEST_CHAT_ID = "chat-generation-error-forced";
export const GENERATION_ERROR_TEST_CHAT_TITLE = "error 답변 채팅";
export const GENERATION_ERROR_TEST_MODEL_ID = "model-ds-thinking";

export function isGenerationErrorTestChat(chatId) {
  return String(chatId || "") === GENERATION_ERROR_TEST_CHAT_ID;
}
