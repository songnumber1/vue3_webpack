import {useChatStore} from "@/stores/chatStore";
import {createId} from "@/utils/id";

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
    msgId,
    respMsgId,
    ...base,
  };
}

function resolvePromptToolSettings() {
  const chatStore = useChatStore();
  return chatStore.activePromptToolSettings || {};
}

function resolveStyleOptions(settings = {}) {
  const values = [];

  if (settings.promptTemplateId) values.push(settings.promptTemplateId);

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
  const settings = resolvePromptToolSettings();
  const knowledgeSearch = Array.isArray(settings.knowledgeSearch)
    ? settings.knowledgeSearch.filter(Boolean)
    : [];

  return createRequestPayload({
    chatId,
    assistId: options.selectedAssistantId?.value || "",
    modelId: options.selectedModel?.value || "",
    studio: false,
    intention: "직접입력",
    rag: true,
    ragCot: false,
    imageS3Path: null,
    sourceType: "internal",
    arrayOptions: knowledgeSearch,
    messageFileHist: null,
    style: resolveStyleOptions(settings),
    body: normalized.text,
    byteSize: 10000,
    lastFederationInfo: null,
    uiStateInfoWrapper: null,
  });
}
