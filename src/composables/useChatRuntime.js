/**
 * @file useChatRuntime.js
 * @description Chat runtime facade that connects mock/live API business logic with Pinia stores.
 */

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { createId } from '@/utils/id'
import { bootstrapChatRuntime, loadChatMessages, loadExamplePrompts } from '@/business/chatBootstrap'
import { useAppRuntimeStore } from '@/stores/appRuntimeStore'
import { useAssistantStore } from '@/stores/assistantStore'
import { useAuthStore } from '@/stores/authStore'
import { useChatStore } from '@/stores/chatStore'

function createLocalHistory({ text, assistant, model }) {
  const id = `chat-local-${Date.now()}`
  return {
    id,
    title: text || '새 채팅',
    preview: text || '첨부 파일 기반 새 대화',
    modelId: model?.id || '',
    assistantId: assistant?.id || '',
    assistantType: assistant?.type || '',
    assistantLabel: assistant?.label || '',
    modelLabel: model?.label || '',
    isPinned: false,
    endedAt: new Date().toISOString(),
    userId: '',
    raw: null,
  }
}

function createSessionFromHistory(history, modelMap = {}, assistantMap = {}) {
  if (!history) return null
  const model = modelMap[history.modelId] || null
  const assistant = assistantMap[history.assistantId || model?.assistId] || null

  return {
    chatId: history.id,
    assistantId: assistant?.id || history.assistantId || '',
    assistantType: assistant?.type || history.assistantType || '',
    assistantLabel: assistant?.label || history.assistantLabel || '',
    modelId: model?.id || history.modelId || '',
    modelName: model?.label || history.modelLabel || '',
    modelType: model?.type || '',
    readonlyModel: true,
  }
}

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

  async function initialize() {
    if (appRuntimeStore.initialized || appRuntimeStore.loading) return
    appRuntimeStore.startLoading()
    try {
      const data = await bootstrapChatRuntime()
      authStore.setAccessInfo(data.accessInfo)
      assistantStore.setBootstrapData(data)
      chatStore.setHistories(data.chatHistories)
      appRuntimeStore.finishLoading()
      await preloadExamplePrompts(assistantStore.selectedAssistantId)
    } catch (error) {
      appRuntimeStore.fail(error)
      throw error
    }
  }

  async function preloadExamplePrompts(assistantId) {
    if (!assistantId || assistantStore.examplePromptMap[assistantId]) return
    const prompts = await loadExamplePrompts({ assistantId })
    assistantStore.setExamplePrompts(assistantId, prompts)
  }

  function selectAssistant(id) {
    if (chatStore.isModelLocked) return
    assistantStore.selectAssistant(id)
    preloadExamplePrompts(id)
  }

  function selectAssistantForNewChat(id) {
    assistantStore.selectAssistant(id)
    chatStore.clearActiveSession()
    preloadExamplePrompts(id)
  }

  function getHistory(id) {
    return chatStore.getHistory(id)
  }

  async function ensureConversation(historyId) {
    const history = getHistory(historyId)
    if (!history) return []

    const session = createSessionFromHistory(history, assistantStore.modelMap, assistantStore.assistantMap)
    chatStore.setActiveSession(session)

    if (!chatStore.messageMap[history.id]) {
      const messages = await loadChatMessages({
        chatId: history.id,
        assistId: session.assistantId,
        modelId: session.modelId,
        studio: session.assistantType === 'studio',
      })
      chatStore.setMessages(history.id, messages)
    }

    return chatStore.messageMap[history.id] || []
  }

  function setConversation(historyId, messages) {
    chatStore.setMessages(historyId, messages)
  }

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

  function clearCurrentChatSelection() {
    chatStore.clearActiveSession()
  }

  function revokeMessageAttachments(items = []) {
    items.forEach((message) => {
      if (!Array.isArray(message.attachments)) return
      message.attachments.forEach((file) => {
        if (file?.url?.startsWith?.('blob:')) URL.revokeObjectURL(file.url)
      })
    })
  }

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
