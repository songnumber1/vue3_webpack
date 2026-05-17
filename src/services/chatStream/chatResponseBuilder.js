/**
 * @description PromptInput에서 전달된 문자열/첨부 payload를 채팅 스트림 처리용 표준 형태로 변환합니다.
 * @param {string|{text?: string, attachments?: Array}} payload - 사용자 입력 payload입니다.
 * @returns {{text: string, attachments: Array}} 정규화된 프롬프트 payload입니다.
 */
export function normalizePromptPayload(payload) {
  if (typeof payload === 'string') {
    return {text: payload.trim(), attachments: []};
  }

  return {
    text: String(payload?.text || '').trim(),
    attachments: Array.isArray(payload?.attachments) ? payload.attachments : [],
  };
}

/**
 * @description 현재 mock 스트림 응답 문구를 생성합니다. 실제 SSE API 전환 시 이 파일만 교체할 수 있도록 분리합니다.
 * @param {{text: string, attachments: Array}} normalized - 정규화된 사용자 입력입니다.
 * @returns {string} assistant mock 응답 본문입니다.
 */
export function buildAssistantResponse(normalized) {
  const fileSummary = normalized.attachments.length
    ? `\n\n첨부 파일 ${normalized.attachments.length}개를 함께 받았습니다. 이미지/파일 미리보기와 메시지 액션 영역도 유지됩니다.`
    : '';

  return `요청하신 내용을 현재 선택된 Assistant/Model 세션 기준으로 정리하겠습니다.\n\n- 입력: ${
    normalized.text || '첨부 기반 요청'
  }\n- 새 대화에서는 Assistant와 모델을 변경할 수 있습니다.\n- 기존 대화방에 진입하면 해당 대화의 모델 세션이 고정되어 모델 변경이 차단됩니다.\n- 현재 응답은 실제 API 호출 구조를 모사한 mock data + adapter + business + Pinia cache 흐름으로 동작합니다.${fileSummary}`;
}
