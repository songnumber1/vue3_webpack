import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";
import {createId} from "@/utils/id";
import {resolveMock} from "@/api/mock/mockUtils";

function readFirstText(...values) {
  const found = values.find(
    (value) => typeof value === "string" && value.trim()
  );
  return found ? found.trim() : "";
}

function resolveChatId(payload = {}) {
  return readFirstText(payload[G.CHAT_ID], payload.chatId);
}

function resolveUserContent(payload = {}) {
  return readFirstText(payload[G.BODY], payload[G.INPUT], payload.content);
}

function resolveRequestId(payload = {}) {
  return readFirstText(
    payload[G.REQUEST_ID],
    payload[G.REQUEST_ID_SNAKE],
    payload[G.MESSAGE_ID]
  );
}

function createMockErrorMessages(payload = {}, cause = {}) {
  const now = new Date().toISOString();
  const chatId = resolveChatId(payload);
  const requestId = resolveRequestId(payload) || createId("error-request");
  const userContent = resolveUserContent(payload) || "오류 테스트 질문입니다.";
  const errorMessage = readFirstText(
    cause.message,
    cause.errorMessage,
    "답변 생성 중 오류가 발생했습니다."
  );

  return [
    {
      id: payload[G.MESSAGE_ID] || createId("message"),
      msgId: payload[G.MESSAGE_ID] || "",
      chatId,
      role: "user",
      content: userContent,
      isSend: true,
      status: "complete",
      sendTime: now,
      intention: payload[G.INTENTION] || "직접입력",
      tags: [],
      refreences: [],
    },
    {
      id: payload[G.RESPONSE_MESSAGE_ID] || createId("message"),
      respMsgId: payload[G.RESPONSE_MESSAGE_ID] || "",
      chatId,
      requestId,
      role: "error",
      content: errorMessage,
      status: "error",
      error: true,
      errorTitle: "답변 생성 실패",
      errorMessage,
      errorCode: cause.code || cause.errorCode || "MOCK_GENERATION_ERROR",
      isSend: true,
      sendTime: now,
      intention: null,
      tags: ["mock", "error"],
      refreences: [],
    },
  ];
}

async function createGenerationErrorMessages(payload = {}, cause = {}) {
  return resolveMock(createMockErrorMessages(payload, cause), 120);
}

export const generationErrorApiMock = {
  createGenerationErrorMessages,
};

export default generationErrorApiMock;
