import {resolveChatApis} from "@/api/runtime/chatApis";
import {adaptAssistantList} from "@/adapters/assistantAdapter";
import {adaptModelList, filterAvailableModels} from "@/adapters/modelAdapter";
import {adaptChatHistoryList, adaptMessageList} from "@/adapters/chatAdapter";
import {adaptExamplePromptList} from "@/adapters/promptAdapter";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description toMap 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} items - items 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function toMap(items = []) {
  // 계산된 결과를 호출부로 반환합니다.
  return items.reduce((acc, item) => {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (item?.id) acc[item.id] = item;
    // 계산된 결과를 호출부로 반환합니다.
    return acc;
  }, {});
}

/**
 * @description groupModelsByAssistant 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} models - models 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function groupModelsByAssistant(models = []) {
  // 계산된 결과를 호출부로 반환합니다.
  return models.reduce((acc, model) => {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!model?.assistId) return acc;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!acc[model.assistId]) acc[model.assistId] = [];
    acc[model.assistId].push(model);
    acc[model.assistId].sort((a, b) => a.order - b.order);
    // 계산된 결과를 호출부로 반환합니다.
    return acc;
  }, {});
}

/**
 * @description pickInitialAssistant 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} assistants - assistants 입력값입니다.
 * @param {*} accessInfo - accessInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function pickInitialAssistant(assistants = [], accessInfo = {}) {
  const preferredIds = Object.keys(accessInfo?.user?.presetInfo?.assist || {});
  const latestPreferredAssistantId = preferredIds.find((id) =>
    assistants.some((item) => item.id === id)
  );
  // 계산된 결과를 호출부로 반환합니다.
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
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!assistant) return null;
  const presetModelId = accessInfo?.user?.presetInfo?.assist?.[assistant.id];
  const models = modelMapByAssistant[assistant.id] || [];
  // 계산된 결과를 호출부로 반환합니다.
  return models.find((item) => item.id === presetModelId) || models[0] || null;
}

/**
 * @description bootstrapChatRuntime 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} options - options 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function bootstrapChatRuntime(options = {}) {
  const {accessInfoOverride = null} = options;
  const {accessApi, assistantApi, modelApi, chatHistoryApi, examplePromptApi} =
    resolveChatApis();

  const accessInfoPromise = accessInfoOverride
    ? Promise.resolve(accessInfoOverride)
    : accessApi.getAccessInfo({language: "ko", entryType: "main"});

  const [
    accessInfo,
    assistantRaw,
    studioRaw,
    modelRaw,
    studioModelRaw,
    chatHistoryRaw,
  ] = await Promise.all([
    accessInfoPromise,
    assistantApi.getAssistants(),
    assistantApi.getStudios(),
    modelApi.getModels(),
    modelApi.getStudioModels(),
    chatHistoryApi.getChatHistoryList(),
  ]);

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
  const examplePromptEntries = await Promise.all(
    assistants.map(async (assistant) => {
      const response = await examplePromptApi.getExamplePrompts({
        assistId: assistant.id,
        studioYN: assistant.type === "studio",
      });
      // 계산된 결과를 호출부로 반환합니다.
      return [assistant.id, adaptExamplePromptList(response)];
    })
  );
  const examplePromptMap = Object.fromEntries(examplePromptEntries);
  const initialAssistant = pickInitialAssistant(assistants, accessInfo);
  const initialModel = pickInitialModel(
    initialAssistant,
    modelMapByAssistant,
    accessInfo
  );

  // 계산된 결과를 호출부로 반환합니다.
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

/**
 * @description loadChatMessages 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} payload - payload 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function loadChatMessages(payload = {}) {
  const {chatHistoryApi} = resolveChatApis();
  const rawMessages = await chatHistoryApi.getChatHistoryDetail(payload);
  // 계산된 결과를 호출부로 반환합니다.
  return adaptMessageList(rawMessages);
}

/**
 * @description loadExamplePrompts 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function loadExamplePrompts({assistantId, studioYN = false} = {}) {
  const {examplePromptApi} = resolveChatApis();
  const response = await examplePromptApi.getExamplePrompts({
    assistId: assistantId,
    studioYN,
  });
  // 계산된 결과를 호출부로 반환합니다.
  return adaptExamplePromptList(response);
}
