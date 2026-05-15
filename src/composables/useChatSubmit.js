/**
 * @file useChatSubmit.js
 * @description Chat submit and fake streaming workflow separated from visual components.
 */

import { nextTick, ref } from 'vue'
import { streamText } from '@/utils/fakeStream'

function normalizePromptPayload(payload) {
  if (typeof payload === 'string') return { text: payload.trim(), attachments: [] }
  return {
    text: String(payload?.text || '').trim(),
    attachments: Array.isArray(payload?.attachments) ? payload.attachments : [],
  }
}

function buildAssistantResponse(normalized) {
  const fileSummary = normalized.attachments.length
    ? `\n\n첨부 파일 ${normalized.attachments.length}개를 함께 받았습니다. 이미지/파일 미리보기와 메시지 액션 영역도 유지됩니다.`
    : ''
  return `요청하신 내용을 현재 선택된 Assistant/Model 세션 기준으로 정리하겠습니다.\n\n- 입력: ${
    normalized.text || '첨부 기반 요청'
  }\n- 새 대화에서는 Assistant와 모델을 변경할 수 있습니다.\n- 기존 대화방에 진입하면 해당 대화의 모델 세션이 고정되어 모델 변경이 차단됩니다.\n- 현재 응답은 실제 API 호출 구조를 모사한 mock data + adapter + business + Pinia cache 흐름으로 동작합니다.${fileSummary}`
}

export function useChatSubmit(options) {
  const isGenerating = ref(false)

  async function handleSubmit(payload) {
    const normalized = normalizePromptPayload(payload)
    if ((!normalized.text && normalized.attachments.length === 0) || isGenerating.value) return

    let targetHistoryId = String(options.route.params.id || '')
    if (options.route.name === 'main') {
      const history = options.createLocalConversation(normalized)
      targetHistoryId = history.id
      await options.router.push({ name: 'chat', params: { id: targetHistoryId } })
      await nextTick()
    }

    const { messages, assistantMessage } = options.appendUserAndAssistantMessages(targetHistoryId, normalized)
    options.messages.value = messages
    await nextTick()
    await options.scrollBottom({ force: true, stable: true })

    isGenerating.value = true
    await streamText(
      buildAssistantResponse(normalized),
      (chunk) => {
        assistantMessage.content = chunk
        options.setConversation(targetHistoryId, messages)
      },
      { delay: 9 },
    )
    isGenerating.value = false
    options.setConversation(targetHistoryId, messages)
    await nextTick()
    await options.renderAfterStream()
  }

  return { isGenerating, handleSubmit }
}
