import {resolveChatApis} from "@/api/runtime/chatApis";
import {adaptAssistantList} from "@/adapters/assistantAdapter";
import {adaptModelList, filterAvailableModels} from "@/adapters/modelAdapter";
import {adaptChatHistoryList, adaptMessageList} from "@/adapters/chatAdapter";
import {adaptExamplePromptList} from "@/adapters/promptAdapter";

/**
 * 배열을 id 기준 lookup map으로 변환합니다.
 *
 * @param {Array<{id: string}>} items - id를 가진 ViewModel 배열입니다.
 * @returns {Record<string, object>} id 기준 map입니다.
 */
function toMap(items = []) {
  return items.reduce((acc, item) => {
    if (item?.id) acc[item.id] = item;
    return acc;
  }, {});
}

/**
 * 모델 목록을 assistId 기준으로 그룹화합니다.
 *
 * @param {Array<object>} models - 삭제되지 않은 모델 ViewModel 목록입니다.
 * @returns {Record<string, Array<object>>} Assistant ID별 모델 목록입니다.
 */
function groupModelsByAssistant(models = []) {
  return models.reduce((acc, model) => {
    if (!model?.assistId) return acc;
    if (!acc[model.assistId]) acc[model.assistId] = [];
    acc[model.assistId].push(model);
    acc[model.assistId].sort((a, b) => a.order - b.order);
    return acc;
  }, {});
}

/**
 * 사용자 preset 기반 초기 Assistant를 선택합니다.
 *
 * @param {Array<object>} assistants - Assistant/Studio 통합 목록입니다.
 * @param {object} accessInfo - access/info.do 응답입니다.
 * @returns {object|null} 초기 선택 Assistant입니다.
 */
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

/**
 * 사용자 preset 기반 초기 모델을 선택합니다.
 *
 * @param {object|null} assistant - 초기 선택 Assistant입니다.
 * @param {Record<string, Array<object>>} modelMapByAssistant - Assistant별 사용 가능 모델 목록입니다.
 * @param {object} accessInfo - access/info.do 응답입니다.
 * @returns {object|null} 초기 선택 모델입니다.
 */
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

/**
 * Chat runtime bootstrap 데이터를 생성합니다.
 *
 * method: Promise.all
 * payload: { language, entryType } 및 분산 API GET 요청
 * response: accessInfo, assistants, models, history, examplePromptMap, lookup map, 초기 선택값
 * 특징:
 * - 운영 API가 분산되어 있으므로 Promise.all로 병렬 호출합니다.
 * - router auth guard가 이미 access/info.do를 호출한 경우 accessInfoOverride를 재사용해 mock/live 불일치를 방지합니다.
 * - 삭제 모델은 allModels/modelMap에는 보존하고 신규 선택 가능 목록에서는 제외합니다.
 *
 * @param {object} [options] - bootstrap 옵션입니다.
 * @param {object|null} [options.accessInfoOverride=null] - auth guard가 저장한 access/info.do 응답입니다.
 * @returns {Promise<object>} Chat runtime 초기화 ViewModel 묶음입니다.
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
 * 대화방 메시지를 조회하고 UI 메시지 ViewModel로 변환합니다.
 *
 * method: POST chat-history/history.do
 * payload: { chatId, assistId, modelId, studio }
 * response: Array<MessageViewModel>
 *
 * @param {object} payload - 대화 상세 조회 payload입니다.
 * @returns {Promise<Array<object>>} 정규화된 메시지 목록입니다.
 */
export async function loadChatMessages(payload = {}) {
  const {chatHistoryApi} = resolveChatApis();
  const rawMessages = await chatHistoryApi.getChatHistoryDetail(payload);
  return adaptMessageList(rawMessages);
}

/**
 * Assistant/Studio에 연결된 예시 프롬프트를 조회합니다.
 *
 * method: GET example-prompts/list.do
 * payload: { assistId, studioYN }
 * response: Array<ExamplePromptViewModel>
 *
 * @param {object} params - 조회 파라미터입니다.
 * @param {string} params.assistantId - Assistant 또는 Studio ID입니다.
 * @param {boolean} [params.studioYN=false] - Studio 여부입니다.
 * @returns {Promise<Array<object>>} 정규화된 예시 프롬프트 목록입니다.
 */
export async function loadExamplePrompts({assistantId, studioYN = false} = {}) {
  const {examplePromptApi} = resolveChatApis();
  const response = await examplePromptApi.getExamplePrompts({
    assistId: assistantId,
    studioYN,
  });
  return adaptExamplePromptList(response);
}
