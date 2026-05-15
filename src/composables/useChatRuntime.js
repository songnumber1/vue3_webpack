/**
 * @file useChatRuntime.js
 * @description Chat runtime facade입니다. business layer, Pinia store, UI container 사이의 연결을 담당합니다.
 */

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { createId } from '@/utils/id'
import { bootstrapChatRuntime, loadChatMessages, loadExamplePrompts } from '@/business/chatBootstrap'
import { useAppRuntimeStore } from '@/stores/appRuntimeStore'
import { useAssistantStore } from '@/stores/assistantStore'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'

/**
 * 서버 저장 전 임시 대화 history ViewModel을 생성합니다.
 *
 * method: local create
 * payload: { text, assistant, model }
 * response: ChatHistoryViewModel
 * 특징: 실제 API 연결 시 temporaryChatId → serverChatId 동기화 포인트입니다.
 *
 * @param {object} params - 생성 파라미터입니다.
 * @param {string} params.text - 최초 사용자 입력입니다.
 * @param {object|null} params.assistant - 현재 선택 Assistant입니다.
 * @param {object|null} params.model - 현재 선택 모델입니다.
 * @returns {object} 임시 대화 목록 ViewModel입니다.
 */
function createLocalHistory({ text, assistant, model }) {
  const id = `chat-local-${Date.now()}`
  return {
    id,
    temporary: true,
    syncStatus: 'local',
    title: text || '새 채팅',
    preview: text || '첨부 파일 기반 새 대화',
    modelId: model?.id || '',
    assistantId: assistant?.id || model?.assistId || '',
    assistantType: assistant?.type || '',
    assistantLabel: assistant?.label || '',
    modelLabel: model?.label || '',
    isPinned: false,
    endedAt: new Date().toISOString(),
    userId: '',
    raw: null,
  }
}

/**
 * 대화 목록 row에서 현재 대화방 session context를 복원합니다.
 *
 * method: session restore
 * payload: ChatHistoryViewModel + modelMap + assistantMap
 * response: ActiveChatSession
 * 특징:
 * - 삭제 모델은 대화 조회는 허용하되 입력을 막기 위해 isModelDeleted=true로 보존합니다.
 * - 모델/Assistant 매핑 실패는 별도 unavailable reason으로 분리해 UI가 안전하게 안내할 수 있게 합니다.
 *
 * @param {object} history - 정규화된 대화 목록 row입니다.
 * @param {Record<string, object>} modelMap - 삭제 모델 포함 전체 모델 map입니다.
 * @param {Record<string, object>} assistantMap - Assistant/Studio map입니다.
 * @returns {object|null} 현재 대화방 session context입니다.
 */
function createSessionFromHistory(history, modelMap = {}, assistantMap = {}) {
  if (!history) return null
  const model = modelMap[history.modelId] || null
  const assistant = assistantMap[history.assistantId || model?.assistId] || null
  const modelMissing = Boolean(history.modelId && !model)
  const assistantMissing = Boolean((history.assistantId || model?.assistId) && !assistant)
  const modelDeleted = Boolean(model?.isDeleted)
  const unavailableReason = modelDeleted
    ? 'deleted'
    : modelMissing
      ? 'missing-model'
      : assistantMissing
        ? 'missing-assistant'
        : ''

  return {
    chatId: history.id,
    assistantId: assistant?.id || history.assistantId || model?.assistId || '',
    assistantType: assistant?.type || history.assistantType || '',
    assistantLabel: assistant?.label || history.assistantLabel || '',
    modelId: model?.id || history.modelId || '',
    modelName: model?.label || history.modelLabel || '',
    modelType: model?.type || '',
    isModelDeleted: modelDeleted,
    isModelMissing: modelMissing,
    isAssistantMissing: assistantMissing,
    isModelUnavailable: Boolean(unavailableReason),
    modelUnavailableReason: unavailableReason,
    displayAssistantId: '',
    displayAssistantLabel: '',
    readonlyModel: true,
  }
}

/**
 * Chat runtime composable을 생성합니다.
 *
 * method: Composition API composable
 * payload: 없음
 * response: ChatContainer에서 사용하는 reactive state와 action 묶음
 * 특징: Component는 API/raw key를 알지 못하고 ViewModel과 action만 사용합니다.
 *
 * @returns {object} Chat runtime state/action facade입니다.
 */
export function useChatRuntime() {
  const appRuntimeStore = useAppRuntimeStore()
  const authStore = useAuthStore()
  const assistantStore = useAssistantStore()
  const chatStore = useChatStore()
  const { assistants, selectedAssistantId, selectedModelId, examplePromptMap } = storeToRefs(assistantStore)
  const { histories } = storeToRefs(chatStore)

  const currentAssistant = computed(() => assistantStore.currentAssistant || assistants.value[0] || { id: '', label: 'Assistant', description: '' })
  const currentExamplePrompts = computed(() => examplePromptMap.value[selectedAssistantId.value] || [])
  const activeSession = computed(() => chatStore.activeSession)
  const isActiveModelDeleted = computed(() => Boolean(chatStore.activeSession?.isModelDeleted))
  const isActiveModelUnavailable = computed(() => Boolean(chatStore.activeSession?.isModelUnavailable))
  const models = computed(() => {
    if (!chatStore.isModelLocked) return assistantStore.currentModels
    return [assistantStore.modelMap[chatStore.activeSession?.modelId]].filter(Boolean)
  })
  const selectedModel = computed({
    get: () => chatStore.activeSession?.modelId || selectedModelId.value,
    set: (id) => {
      if (chatStore.isModelLocked) return
      assistantStore.selectModel(id)
    },
  })
  const isModelLocked = computed(() => chatStore.isModelLocked)
  const conversations = computed(() => chatStore.messageMap)

  /**
   * 앱 최초 진입 시 chat runtime에 필요한 데이터를 초기화합니다.
   *
   * method: bootstrapChatRuntime
   * payload: authStore.accessInfo optional override
   * response: Assistant/Model/History/Prompt store 초기화
   * 특징: auth guard가 이미 조회한 accessInfo를 재사용해 mock/live 불일치를 방지합니다.
   *
   * @returns {Promise<void>} 초기화 완료 Promise입니다.
   */
  async function initialize() {
    if (appRuntimeStore.initialized || appRuntimeStore.loading) return
    appRuntimeStore.startLoading()
    try {
      const data = await bootstrapChatRuntime({
        accessInfoOverride: authStore.accessInfo || null,
      })
      if (data.accessInfo?.user) {
        authStore.setAuthenticatedAccessInfo(data.accessInfo)
      } else {
        authStore.setAccessInfo(data.accessInfo)
      }
      assistantStore.setBootstrapData(data)
      chatStore.setHistories(data.chatHistories)
      appRuntimeStore.finishLoading()
      await preloadExamplePrompts(assistantStore.selectedAssistantId)
    } catch (error) {
      appRuntimeStore.fail(error)
      throw error
    }
  }

  /**
   * 특정 Assistant의 예시 프롬프트를 필요 시 lazy load합니다.
   *
   * @param {string} assistantId - Assistant 또는 Studio ID입니다.
   * @returns {Promise<void>} 프롬프트 로딩 완료 Promise입니다.
   */
  async function preloadExamplePrompts(assistantId) {
    if (!assistantId || assistantStore.examplePromptMap[assistantId]) return
    const assistant = assistantStore.assistantMap[assistantId]
    const prompts = await loadExamplePrompts({ assistantId, studioYN: assistant?.type === 'studio' })
    assistantStore.setExamplePrompts(assistantId, prompts)
  }

  /**
   * 새 대화 상태가 아닐 때 Assistant 선택을 처리합니다.
   *
   * @param {string} id - 선택할 Assistant ID입니다.
   * @returns {void}
   */
  function selectAssistant(id) {
    if (chatStore.isModelLocked) return
    assistantStore.selectAssistant(id)
    preloadExamplePrompts(id)
  }

  /**
   * Assistant 선택과 동시에 기존 대화 session을 초기화해 새 대화 상태로 전환합니다.
   *
   * @param {string} id - 선택할 Assistant ID입니다.
   * @returns {void}
   */
  function selectAssistantForNewChat(id) {
    assistantStore.selectAssistant(id)
    chatStore.clearActiveSession()
    preloadExamplePrompts(id)
  }

  /**
   * ID에 해당하는 대화 목록 row를 조회합니다.
   * @param {string} id - chatId입니다.
   * @returns {object|null} 대화 목록 ViewModel입니다.
   */
  function getHistory(id) {
    return chatStore.getHistory(id)
  }

  /**
   * route의 chatId에 맞는 대화방 session과 메시지를 보장합니다.
   *
   * method: chat-history/history.do
   * payload: { chatId, assistId, modelId, studio }
   * response: Array<MessageViewModel>
   * 특징: session 복원 실패/삭제 모델 상태도 activeSession에 저장해 composer UI가 안전하게 분기합니다.
   *
   * @param {string} historyId - 열려는 chatId입니다.
   * @returns {Promise<Array<object>>} 메시지 목록입니다.
   */
  async function ensureConversation(historyId) {
    const history = getHistory(historyId)
    if (!history) return []

    const session = createSessionFromHistory(history, assistantStore.modelMap, assistantStore.assistantMap)
    const fallbackAssistant = assistantStore.assistants[0] || null
    const shouldUseFallbackAssistant = Boolean(
      session?.isModelDeleted ||
        session?.isModelMissing ||
        session?.isAssistantMissing ||
        !session?.assistantId,
    )
    const displayAssistant = shouldUseFallbackAssistant
      ? fallbackAssistant
      : assistantStore.assistantMap[session.assistantId] || fallbackAssistant

    if (displayAssistant?.id) {
      assistantStore.selectAssistant(displayAssistant.id)
      session.displayAssistantId = displayAssistant.id
      session.displayAssistantLabel = displayAssistant.label
    }

    chatStore.setActiveSession(session)

    if (!chatStore.messageMap[history.id]) {
      const messages = await loadChatMessages({
        chatId: history.id,
        assistId: session?.assistantId || history.assistantId,
        modelId: session?.modelId || history.modelId,
        studio: session?.assistantType === 'studio',
      })
      chatStore.setMessages(history.id, messages)
    }

    return chatStore.messageMap[history.id] || []
  }

  /**
   * 특정 대화방의 메시지를 store에 저장합니다.
   * @param {string} historyId - chatId입니다.
   * @param {Array<object>} messages - 메시지 목록입니다.
   * @returns {void}
   */
  function setConversation(historyId, messages) {
    chatStore.setMessages(historyId, messages)
  }

  /**
   * 서버 저장 전 로컬 대화를 생성합니다.
   * @param {object} [params] - 생성 옵션입니다.
   * @param {string} [params.text] - 최초 메시지입니다.
   * @returns {object} 생성된 local history입니다.
   */
  function createLocalConversation({ text } = {}) {
    const history = createLocalHistory({
      text,
      assistant: assistantStore.currentAssistant,
      model: assistantStore.currentModel || assistantStore.currentModels[0],
    })
    chatStore.addHistory(history)
    chatStore.setMessages(history.id, [])
    chatStore.setActiveSession(createSessionFromHistory(history, assistantStore.modelMap, assistantStore.assistantMap))
    return history
  }

  /**
   * 현재 대화방 선택/session을 초기화합니다.
   * @returns {void}
   */
  function clearCurrentChatSelection() {
    chatStore.clearActiveSession()
  }

  /**
   * blob URL 첨부 미리보기 리소스를 해제합니다.
   * @param {Array<object>} items - 메시지 목록입니다.
   * @returns {void}
   */
  function revokeMessageAttachments(items = []) {
    items.forEach((message) => {
      if (!Array.isArray(message.attachments)) return
      message.attachments.forEach((file) => {
        if (file?.url?.startsWith?.('blob:')) URL.revokeObjectURL(file.url)
      })
    })
  }

  /**
   * 사용자 메시지와 빈 assistant streaming 메시지를 현재 대화방에 추가합니다.
   * @param {string} chatId - 대상 chatId입니다.
   * @param {object} normalized - 정규화된 submit payload입니다.
   * @returns {{messages: Array<object>, assistantMessage: object}} 추가 결과입니다.
   */
  function appendUserAndAssistantMessages(chatId, normalized) {
    const currentMessages = chatStore.messageMap[chatId] || []
    const userMessage = {
      id: createId('message'),
      role: 'user',
      content: normalized.text,
      attachments: normalized.attachments,
      createdAt: new Date().toISOString(),
    }
    const assistantMessage = {
      id: createId('message'),
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }
    const nextMessages = [...currentMessages, userMessage, assistantMessage]
    chatStore.setMessages(chatId, nextMessages)
    return { messages: nextMessages, assistantMessage }
  }

  return {
    initialize,
    assistants,
    currentAssistant,
    currentExamplePrompts,
    histories,
    models,
    activeSession,
    selectedAssistantId,
    selectedModel,
    isModelLocked,
    isActiveModelDeleted,
    isActiveModelUnavailable,
    conversations,
    selectAssistant,
    selectAssistantForNewChat,
    getHistory,
    ensureConversation,
    setConversation,
    createLocalConversation,
    clearCurrentChatSelection,
    appendUserAndAssistantMessages,
    revokeMessageAttachments,
  }
}
