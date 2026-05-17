import {streamText} from '@/utils/fakeStream';
import {buildAssistantResponse} from './chatResponseBuilder';

/**
 * @description assistant 응답 스트림을 실행합니다. 현재는 mock stream이며, 실제 SSE/WebClient 연동 시 동일 인터페이스를 유지합니다.
 * @param {{text: string, attachments: Array}} normalized - 정규화된 사용자 입력입니다.
 * @param {(chunk: string) => void} onChunk - 스트림 chunk 수신 핸들러입니다.
 * @param {{delay?: number}} options - 스트림 실행 옵션입니다.
 * @returns {Promise<void>} 스트림 완료 promise입니다.
 */
export function streamAssistantResponse(normalized, onChunk, options = {}) {
  return streamText(buildAssistantResponse(normalized), onChunk, {
    delay: options.delay ?? 9,
  });
}
