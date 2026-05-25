export const SSE_DONE_TOKEN = "[DONE]";

/**
 * ReadableStream에서 받은 문자열 buffer를 SSE event 단위로 분리합니다.
 *
 * SSE frame은 빈 줄(`\n\n`)로 끝나지만 네트워크 chunk는 중간에서 끊길 수 있습니다.
 * 따라서 마지막 조각은 rest로 돌려 다음 read 결과와 다시 합칩니다.
 *
 * @param {string} buffer 이전 rest와 새 chunk를 합친 문자열
 * @returns {{events: string[], rest: string}} 완성된 data frame 목록과 미완성 나머지
 */
export function parseSseBuffer(buffer) {
  const events = [];
  const parts = String(buffer || "").split(/\r?\n\r?\n/);
  const rest = parts.pop() || "";

  parts.forEach((part) => {
    const dataLines = part
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.replace(/^data:\s?/, ""));
    if (!dataLines.length) return;
    events.push(dataLines.join("\n"));
  });

  return {events, rest};
}

/**
 * 하나의 SSE data frame을 프로젝트 내부 stream event 형태로 정규화합니다.
 *
 * JSON 파싱이 가능하면 `data`, `content`, `reason`, `reasonContent`를 지원하고,
 * JSON이 아니면 raw 문자열 자체를 일반 답변 content로 처리합니다.
 *
 * @param {string} raw `data:` prefix가 제거된 frame 문자열
 * @returns {{done: boolean, type?: string, content: string, reason: string}}
 */
export function readSseData(raw) {
  // 백엔드 완료 신호는 content로 누적하지 않고 종료 상태만 전달합니다.
  if (raw === SSE_DONE_TOKEN) return {done: true, content: ""};
  try {
    const parsed = JSON.parse(raw);
    const type = String(parsed?.type || (parsed?.reason != null ? "reason" : "answer"));
    return {
      done: false,
      type,
      content: String(parsed?.data ?? parsed?.content ?? ""),
      reason: String(parsed?.reason ?? parsed?.reasonContent ?? ""),
    };
  } catch (_error) {
    // plain text SSE도 허용해 mock/레거시 백엔드와 호환합니다.
    return {done: false, type: "answer", content: String(raw || ""), reason: ""};
  }
}
