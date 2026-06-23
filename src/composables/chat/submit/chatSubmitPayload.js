import {usePromptControlStore} from "@/stores/promptControlStore";
import {createId} from "@/utils/id";
import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";

export function normalizePromptPayload(payload) {
  if (typeof payload === "string") {
    return {text: payload.trim(), attachments: [], keyboardOpenOnSubmit: false};
  }

  return {
    text: String(payload?.text || "").trim(),
    attachments: Array.isArray(payload?.attachments) ? payload.attachments : [],
    keyboardOpenOnSubmit: payload?.keyboardOpenOnSubmit === true,
  };
}

function createRequestPayload(base = {}) {
  const msgId = createId("message");
  const respMsgId = createId("message");
  return {
    [G.MESSAGE_ID]: msgId,
    [G.RESPONSE_MESSAGE_ID]: respMsgId,
    ...base,
  };
}

function normalizeChatId(chatId) {
  return String(chatId || "").trim();
}

function resolvePromptToolSettings() {
  const promptControlStore = usePromptControlStore();
  return promptControlStore.activePromptToolSettings || {};
}

function resolveStyleOptions(settings = {}) {
  const values = [];

  Object.values(settings.promptTemplateOptions || {}).forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) values.push(String(item));
      });
      return;
    }

    if (value) values.push(String(value));
  });

  return values;
}

export function createGenerationPayload(options, normalized, chatId) {
  const resolvedChatId = normalizeChatId(chatId);

  if (!resolvedChatId) {
    throw new Error(
      "generation.do payload requires chatId from new.do or current route."
    );
  }

  const settings = resolvePromptToolSettings();
  const knowledgeSearch = Array.isArray(settings.knowledgeSearch)
    ? settings.knowledgeSearch.filter(Boolean)
    : [];

  return createRequestPayload({
    [G.CHAT_ID]: resolvedChatId,
    [G.ASSIST_ID]: options.selectedAssistantId?.value || "",
    [G.MODEL_ID]: options.selectedModel?.value || "",
    [G.STUDIO]: false,
    [G.INTENTION]: "직접입력",
    [G.RAG]: knowledgeSearch.length > 0,
    [G.RAG_COT]: false,
    [G.IMAGE_S3_PATH_LEGACY]: null,
    [G.SOURCE_TYPE]: "internal",
    [G.ARRAY_OPTIONS]: knowledgeSearch,
    [G.MESSAGE_FILE_HISTORY]: null,
    [G.STYLES]: resolveStyleOptions(settings),
    [G.BODY]: normalized.text,
    [G.BYTE_SIZE]: 10000,
    [G.LAST_FEDERATION_INFO]: null,
    [G.UI_STATE_INFO_WRAPPER]: null,
  });
}
