/**
 * @file api/sse/common/streamGenerationCore.js
 * @description SSE 스트리밍 계층입니다. fetch ReadableStream, data: frame 파싱, chunk commit, 모바일 lifecycle abort를 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {parseSseBuffer} from "@/api/sse/sseParser";
import {appendParsedEvents} from "@/api/sse/common/sseFrame";
import {createChunkCommitter} from "@/api/sse/common/chunkCommitter";
import {createAbortError, isGenerationAbortError} from "@/api/sse/common/sseErrors";
import {resolveGenerationUrl} from "@/api/sse/common/streamRequest";
import {logWarn} from "@/utils/logger";

/**
 * [SSE 실제 수신 계층]
 * 이 프로젝트는 EventSource가 아니라 fetch + ReadableStream으로 SSE를 처리합니다.
 * POST body, credentials, AbortController가 필요하기 때문에 EventSource 대신 reader.read() 루프를 사용합니다.
 *
 * 처리 순서:
 * - fetch(generation.do)
 * - response.body.getReader()
 * - TextDecoder로 Uint8Array를 문자열 buffer로 누적
 * - parseSseBuffer()로 data: frame 단위 분리
 * - appendParsedEvents()로 content/reasoning/[DONE] 반영
 * - chunkCommitter가 Vue 업데이트 빈도를 제어
 */

/**
 * 실제 generation.do SSE 요청을 실행하는 핵심 함수입니다.
 *
 * 이 프로젝트는 EventSource가 아니라 fetch + ReadableStream 방식을 사용합니다.
 * 그 이유는 질문 payload를 POST body로 전송하고, AbortController로 모바일/웹뷰
 * 백그라운드 전환 시 스트림을 직접 중단해야 하기 때문입니다.
 *
 * 처리 순서:
 * 1. lifecycle을 설치해 모바일 Chrome/WebView의 hidden/pagehide 이벤트를 연결합니다.
 * 2. generation.do에 text/event-stream 요청을 보냅니다.
 * 3. response.body.getReader()로 byte chunk를 읽습니다.
 * 4. TextDecoder + parseSseBuffer로 `data: ...\n\n` frame을 분리합니다.
 * 5. appendParsedEvents로 답변/추론 누적 문자열을 만들고 committer로 UI에 전달합니다.
 * 6. [DONE] 또는 stream 종료 시 마지막 chunk를 flush하고 onComplete를 호출합니다.
 *
 * @param {Object} params
 * @param {Object} params.payload generation.do로 전송할 요청 payload
 * @param {Object} params.handlers onChunk/onReasonChunk/onComplete 콜백 모음
 * @param {AbortController} params.controller 스트림 중단용 AbortController
 * @param {Object} params.lifecycle 브라우저/웹뷰별 스트림 생명주기 처리기
 * @param {string} params.runtimeType 현재 스트림 런타임 타입
 * @returns {Promise<{completed: boolean, requestId: string, accumulated: string, reasonAccumulated: string, runtimeType: string}>}
 */
export async function runSseGenerationStream({
  payload,
  handlers,
  controller,
  lifecycle,
  runtimeType = "unknown",
}) {
  const {onChunk, onReasonChunk, onComplete} = handlers || {};
  // 답변/추론 각각의 누적 문자열을 UI에 너무 자주 commit하지 않도록 분리합니다.
  const committer = createChunkCommitter(onChunk);
  const reasonCommitter = createChunkCommitter(onReasonChunk);
  let reader = null;
  let accumulated = "";
  let reasonAccumulated = "";

  // lifecycle은 모바일 Chrome/WebView에서 background 전환, pagehide, reader cancel을 담당합니다.
  const cleanupLifecycle = lifecycle?.install?.({
    controller,
    getReader: () => reader,
    getAccumulated: () => accumulated,
    flush: () => Promise.all([committer.flush(accumulated), reasonCommitter.flush(reasonAccumulated)]),
  });

  try {
    // EventSource가 아닌 fetch stream이므로 POST body와 AbortController를 모두 사용할 수 있습니다.
    const response = await fetch(resolveGenerationUrl(), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(payload),
      signal: controller?.signal,
    });

    if (!response.ok) {
      throw new Error(`generation stream failed: ${response.status}`);
    }
    if (!response.body) {
      throw new Error("generation stream body is empty");
    }

    // ReadableStream reader로 서버가 밀어주는 SSE byte chunk를 순차적으로 읽습니다.
    reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let done = false;

    while (!done) {
      if (controller?.signal?.aborted) {
        throw controller.signal.reason || createAbortError("Aborted");
      }

      const result = await reader.read();
      done = result.done;

      if (result.value) {
        buffer += decoder.decode(result.value, {stream: true});
      }

      if (done) {
        buffer += decoder.decode();
      }

      // buffer에는 frame이 중간에서 잘린 문자열이 들어올 수 있으므로 rest를 다음 read까지 보관합니다.
      const parsed = parseSseBuffer(buffer);
      buffer = parsed.rest;

      // data frame을 답변(content), 추론(reason), 완료([DONE]) 상태로 누적 변환합니다.
      const nextState = appendParsedEvents(parsed.events, accumulated, reasonAccumulated);
      accumulated = nextState.accumulated;
      reasonAccumulated = nextState.reasonAccumulated;

      if (nextState.done) done = true;
      if (nextState.reasonChanged) {
        reasonCommitter.update(reasonAccumulated);
      }
      if (nextState.changed) {
        lifecycle?.onAccumulated?.({accumulated, committer});
      }
    }

    // 마지막 frame이 schedule만 되고 아직 UI에 반영되지 않았을 수 있어 완료 전에 강제 반영합니다.
    await reasonCommitter.flush(reasonAccumulated);
    await committer.flush(accumulated);
    await onComplete?.({requestId: payload?.requestId || payload?.request_id || ""});

    return {
      completed: true,
      requestId: payload?.requestId || payload?.request_id || "",
      accumulated,
      reasonAccumulated,
      runtimeType,
    };
  } catch (error) {
    // 마지막 frame이 schedule만 되고 아직 UI에 반영되지 않았을 수 있어 완료 전에 강제 반영합니다.
    await reasonCommitter.flush(reasonAccumulated);
    await committer.flush(accumulated);
    // 상위 useChatSubmit에서 중단/오류 후에도 마지막까지 받은 내용을 보존할 수 있게 에러에 누적값을 붙입니다.
    error.accumulated = accumulated;
    error.reasonAccumulated = reasonAccumulated;
    error.generationRequestId = payload?.requestId || payload?.request_id || "";
    throw error;
  } finally {
    cleanupLifecycle?.();

    // Abort 이후 reader가 살아있으면 네트워크 리소스가 남을 수 있어 한 번 더 cancel합니다.
    if (reader && controller?.signal?.aborted) {
      await reader.cancel(controller.signal.reason).catch((error) => {
        if (!isGenerationAbortError(error)) {
          logWarn("[streamGeneration] reader cleanup failed:", error);
        }
      });
    }
  }
}
