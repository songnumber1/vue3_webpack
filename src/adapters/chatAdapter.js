/**
 * @file chatAdapter.js
 * @description 운영 chat-history API 응답을 UI에서 사용하는 Chat/Message ViewModel로 변환합니다.
 */

import { CHAT_KEYS, MESSAGE_KEYS } from '@/constants/apiKeys'
import { MESSAGE_ROLES } from '@/constants/domain'
import { toBoolean } from './booleanAdapter'

/**
 * chat-history/list.do의 단일 row를 ChatHistoryViewModel로 변환합니다.
 *
 * method: adapter
 * payload: raw chat history row
 * response: { id, title, modelId, assistantId, isPinned, endedAt }
 * 특징: 운영 API의 modeId 오타/legacy key를 modelId로 흡수합니다.
 *
 * @param {object} raw - chat-history/list.do raw row입니다.
 * @param {object} context - assistant/model lookup context입니다.
 * @param {Record<string, object>} context.modelMap - 모델 lookup map입니다.
 * @param {Record<string, object>} context.assistantMap - Assistant lookup map입니다.
 * @returns {object} ChatHistoryViewModel입니다.
 */
export function adaptChatHistory(raw = {}, context = {}) {
  const modelId = raw[CHAT_KEYS.MODEL_ID] || raw[CHAT_KEYS.LEGACY_MODEL_ID]
  const model = context.modelMap?.[modelId] || null
  const assistant = model ? context.assistantMap?.[model.assistId] : null

  return {
    id: raw[CHAT_KEYS.ID],
    title: raw[CHAT_KEYS.TITLE] || '새 대화',
    preview: raw[CHAT_KEYS.TITLE] || '저장된 대화',
    modelId,
    assistantId: model?.assistId || raw.assistId || raw.assistantId || null,
    assistantType: assistant?.type || null,
    assistantLabel: assistant?.label || '',
    modelLabel: model?.label || '',
    isPinned: toBoolean(raw[CHAT_KEYS.BOOKMARK_YN]),
    endedAt: raw[CHAT_KEYS.ENDED_AT] || '',
    userId: raw[CHAT_KEYS.USER_ID] || '',
    raw,
  }
}

/**
 * 대화 목록 raw 배열을 정렬된 ChatHistoryViewModel 배열로 변환합니다.
 *
 * @param {Array<object>} rawItems - chat-history/list.do raw 배열입니다.
 * @param {object} context - adapter lookup context입니다.
 * @returns {Array<object>} pinned 우선, 최신순 정렬된 대화 목록입니다.
 */
export function adaptChatHistoryList(rawItems = [], context = {}) {
  return rawItems
    .map((item) => adaptChatHistory(item, context))
    .filter((item) => item.id)
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.endedAt || 0).getTime() - new Date(a.endedAt || 0).getTime()
    })
}

/**
 * chat-history/history.do의 단일 메시지를 MessageViewModel로 변환합니다.
 *
 * method: adapter
 * payload: raw message row
 * response: { id, role, content, createdAt, references }
 * 특징: refreences 오타 legacy key를 references로 흡수합니다.
 *
 * @param {object} raw - 메시지 raw row입니다.
 * @returns {object} MessageViewModel입니다.
 */
export function adaptMessage(raw = {}) {
  return {
    id: raw[MESSAGE_KEYS.ID],
    role: raw[MESSAGE_KEYS.ROLE] === MESSAGE_ROLES.USER ? MESSAGE_ROLES.USER : MESSAGE_ROLES.ASSISTANT,
    content: raw[MESSAGE_KEYS.CONTENT] || '',
    createdAt: raw[MESSAGE_KEYS.SENT_AT] || '',
    isSent: toBoolean(raw.isSend),
    isRag: toBoolean(raw.isRAG),
    isRagCot: toBoolean(raw.isRagCot),
    intention: raw.intention || null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    references: raw[MESSAGE_KEYS.REFERENCES] || raw[MESSAGE_KEYS.LEGACY_REFERENCES] || [],
    raw,
  }
}

/**
 * 메시지 raw 배열을 시간순 MessageViewModel 배열로 변환합니다.
 * @param {Array<object>} rawItems - chat-history/history.do raw 배열입니다.
 * @returns {Array<object>} 정렬된 메시지 ViewModel 배열입니다.
 */
export function adaptMessageList(rawItems = []) {
  return rawItems
    .map(adaptMessage)
    .filter((item) => item.id && item.content !== undefined)
    .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())
}
