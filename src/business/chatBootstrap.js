import { resolveChatApis } from '@/api/runtime/chatApis'
import { adaptAssistantList } from '@/adapters/assistantAdapter'
import { adaptModelList } from '@/adapters/modelAdapter'
import { adaptChatHistoryList, adaptMessageList } from '@/adapters/chatAdapter'
import { adaptExamplePromptList } from '@/adapters/promptAdapter'

function toMap(items = []) {
  return items.reduce((acc, item) => {
    acc[item.id] = item
    return acc
  }, {})
}

function groupModelsByAssistant(models = []) {
  return models.reduce((acc, model) => {
    if (!acc[model.assistId]) acc[model.assistId] = []
    acc[model.assistId].push(model)
    acc[model.assistId].sort((a, b) => a.order - b.order)
    return acc
  }, {})
}

function pickInitialAssistant(assistants, accessInfo) {
  const latestPreferredAssistantId = Object.keys(accessInfo?.user?.presetInfo?.assist || {})[0]
  return assistants.find((item) => item.id === latestPreferredAssistantId) || assistants[0] || null
}

function pickInitialModel(assistant, modelMapByAssistant, accessInfo) {
  if (!assistant) return null
  const presetModelId = accessInfo?.user?.presetInfo?.assist?.[assistant.id]
  const models = modelMapByAssistant[assistant.id] || []
  return models.find((item) => item.id === presetModelId) || models[0] || null
}

export async function bootstrapChatRuntime() {
  const { accessApi, assistantApi, modelApi, chatHistoryApi } = resolveChatApis()

  const [accessInfo, assistantRaw, studioRaw, modelRaw, studioModelRaw] = await Promise.all([
    accessApi.getAccessInfo({ language: 'ko', entryType: 'main' }),
    assistantApi.getAssistants(),
    assistantApi.getStudios(),
    modelApi.getModels(),
    modelApi.getStudioModels(),
  ])

  const assistants = [...adaptAssistantList(assistantRaw), ...adaptAssistantList(studioRaw)].sort((a, b) => a.order - b.order)
  const models = [...adaptModelList(modelRaw), ...adaptModelList(studioModelRaw)]
  const assistantMap = toMap(assistants)
  const modelMap = toMap(models)
  const modelMapByAssistant = groupModelsByAssistant(models)
  const chatHistories = adaptChatHistoryList(await chatHistoryApi.getChatHistoryList(), { assistantMap, modelMap })
  const initialAssistant = pickInitialAssistant(assistants, accessInfo)
  const initialModel = pickInitialModel(initialAssistant, modelMapByAssistant, accessInfo)

  return {
    accessInfo,
    assistants,
    models,
    assistantMap,
    modelMap,
    modelMapByAssistant,
    chatHistories,
    initialAssistantId: initialAssistant?.id || '',
    initialModelId: initialModel?.id || '',
  }
}

export async function loadChatMessages({ chatId }) {
  const { chatHistoryApi } = resolveChatApis()
  const rawMessages = await chatHistoryApi.getChatHistoryDetail({ chatId })
  return adaptMessageList(rawMessages)
}

export async function loadExamplePrompts({ assistantId } = {}) {
  const { examplePromptApi } = resolveChatApis()
  const response = await examplePromptApi.getExamplePrompts({ assistId: assistantId })
  return adaptExamplePromptList(response)
}
