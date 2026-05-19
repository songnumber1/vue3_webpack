import {resolveChatApis} from "@/api/runtime/chatApis";
import {adaptAssistantList} from "@/adapters/assistantAdapter";
import {adaptModelList, filterAvailableModels} from "@/adapters/modelAdapter";
import {adaptChatHistoryList, adaptMessageList} from "@/adapters/chatAdapter";
import {adaptExamplePromptList} from "@/adapters/promptAdapter";

function toMap(items = []) {
  return items.reduce((acc, item) => {
    if (item?.id) acc[item.id] = item;

    return acc;
  }, {});
}
function groupModelsByAssistant(models = []) {
  return models.reduce((acc, model) => {
    if (!model?.assistId) return acc;
    if (!acc[model.assistId]) acc[model.assistId] = [];
    acc[model.assistId].push(model);
    acc[model.assistId].sort((a, b) => a.order - b.order);

    return acc;
  }, {});
}
function pickInitialAssistant(assistants = [], accessInfo = {}) {
  const preferredIds = Object.keys(accessInfo?.user?.presetInfo?.assist || {});
  const latestPreferredAssistantId = preferredIds.find((id) =>
    assistants.some((item) => item.id === id)
  );

  return (
    assistants.find((item) => item.id === latestPreferredAssistantId) ||
    assistants[0] ||
    null
  );
}

function pickInitialModel(
  assistant,
  modelMapByAssistant = {},
  accessInfo = {}
) {
  if (!assistant) return null;
  const presetModelId = accessInfo?.user?.presetInfo?.assist?.[assistant.id];
  const models = modelMapByAssistant[assistant.id] || [];

  return models.find((item) => item.id === presetModelId) || models[0] || null;
}
export async function bootstrapChatRuntime(options = {}) {
  const {accessInfoOverride = null} = options;
  const {accessApi, assistantApi, modelApi, chatHistoryApi, examplePromptApi} =
    resolveChatApis();

  const accessInfoPromise = accessInfoOverride
    ? Promise.resolve(accessInfoOverride)
    : accessApi.getAccessInfo({language: "ko", entryType: "main"});

  const bootstrapResults = await Promise.allSettled([
    accessInfoPromise,
    assistantApi.getAssistants(),
    assistantApi.getStudios(),
    modelApi.getModels(),
    modelApi.getStudioModels(),
    chatHistoryApi.getChatHistoryList(),
  ]);

  const readSettledValue = (index, fallbackValue) =>
    bootstrapResults[index].status === "fulfilled"
      ? bootstrapResults[index].value
      : fallbackValue;

  const accessInfo = readSettledValue(0, null);
  if (!accessInfo) {
    throw (
      bootstrapResults[0].reason || new Error("Access info bootstrap failed.")
    );
  }

  const assistantRaw = readSettledValue(1, []);
  const studioRaw = readSettledValue(2, []);
  const modelRaw = readSettledValue(3, []);
  const studioModelRaw = readSettledValue(4, []);
  const chatHistoryRaw = readSettledValue(5, []);

  const assistants = [
    ...adaptAssistantList(assistantRaw),
    ...adaptAssistantList(studioRaw),
  ]
    .filter((item) => item.isAuthorized && !item.isDeleted)
    .sort((a, b) => a.order - b.order);

  const allModels = [
    ...adaptModelList(modelRaw, {includeDeleted: true}),
    ...adaptModelList(studioModelRaw, {includeDeleted: true}),
  ];
  const models = filterAvailableModels(allModels);
  const assistantMap = toMap(assistants);
  const modelMap = toMap(allModels);
  const modelMapByAssistant = groupModelsByAssistant(models);
  const chatHistories = adaptChatHistoryList(chatHistoryRaw, {
    assistantMap,
    modelMap,
  });
  const examplePromptResults = await Promise.allSettled(
    assistants.map(async (assistant) => {
      const response = await examplePromptApi.getExamplePrompts({
        assistId: assistant.id,
        studioYN: assistant.type === "studio",
      });
      return [assistant.id, adaptExamplePromptList(response)];
    })
  );
  const examplePromptMap = Object.fromEntries(
    examplePromptResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value)
  );
  const initialAssistant = pickInitialAssistant(assistants, accessInfo);
  const initialModel = pickInitialModel(
    initialAssistant,
    modelMapByAssistant,
    accessInfo
  );

  return {
    accessInfo,
    assistants,
    models,
    allModels,
    assistantMap,
    modelMap,
    modelMapByAssistant,
    chatHistories,
    examplePromptMap,
    initialAssistantId: initialAssistant?.id || "",
    initialModelId: initialModel?.id || "",
  };
}
export async function loadChatHistoryList(context = {}) {
  const {chatHistoryApi} = resolveChatApis();
  const rawHistories = await chatHistoryApi.getChatHistoryList();
  return adaptChatHistoryList(rawHistories, context);
}

export async function updateChatBookmark(payload = {}) {
  const {chatHistoryApi} = resolveChatApis();
  return chatHistoryApi.updateBookmark(payload);
}

export async function renameChatHistory(payload = {}) {
  const {chatHistoryApi} = resolveChatApis();
  return chatHistoryApi.renameChat(payload);
}

export async function deleteChatHistory(payload = {}) {
  const {chatHistoryApi} = resolveChatApis();
  return chatHistoryApi.deleteChat(payload);
}

export async function loadChatMessages(payload = {}) {
  const {chatHistoryApi} = resolveChatApis();
  const rawMessages = await chatHistoryApi.getChatHistoryDetail(payload);

  return adaptMessageList(rawMessages);
}
export async function loadExamplePrompts({assistantId, studioYN = false} = {}) {
  const {examplePromptApi} = resolveChatApis();
  const response = await examplePromptApi.getExamplePrompts({
    assistId: assistantId,
    studioYN,
  });

  return adaptExamplePromptList(response);
}
