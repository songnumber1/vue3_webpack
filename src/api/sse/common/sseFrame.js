import {readSseData} from "@/api/sse/sseParser";

/**
 * parseSseBuffer가 분리한 data frame 목록을 답변/추론 누적 상태로 변환합니다.
 *
 * 백엔드가 내려줄 수 있는 형태:
 * - data: {"data":"답변"}
 * - data: {"content":"답변"}
 * - data: {"type":"reason","reason":"추론"}
 * - data: [DONE]
 *
 * @param {string[]} events 완성된 SSE data frame 목록
 * @param {string} accumulated 현재까지 누적된 답변 문자열
 * @param {string} reasonAccumulated 현재까지 누적된 추론 문자열
 * @returns {{accumulated: string, reasonAccumulated: string, changed: boolean, reasonChanged: boolean, done: boolean}}
 */
export function appendParsedEvents(events, accumulated, reasonAccumulated = "") {
  let nextAccumulated = accumulated;
  let nextReasonAccumulated = reasonAccumulated;
  let changed = false;
  let reasonChanged = false;
  let streamDone = false;

  for (const event of events) {
    const data = readSseData(event);

    // [DONE]은 이후 frame을 더 처리하지 않고 stream 종료 신호로만 사용합니다.
    if (data.done) {
      streamDone = true;
      break;
    }

    // 추론 token은 답변 content와 별도 영역에 렌더링되므로 별도 누적합니다.
    if (data.type === "reason") {
      const reasonContent = data.reason || data.content;
      if (!reasonContent) continue;
      nextReasonAccumulated += reasonContent;
      reasonChanged = true;
      continue;
    }

    if (!data.content) continue;

    // 일반 답변 token은 누적 문자열 전체를 만들어 onChunk에 전달합니다.
    nextAccumulated += data.content;
    changed = true;
  }

  return {
    accumulated: nextAccumulated,
    reasonAccumulated: nextReasonAccumulated,
    changed,
    reasonChanged,
    done: streamDone,
  };
}
