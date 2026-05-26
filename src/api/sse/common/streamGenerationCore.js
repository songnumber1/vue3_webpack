/**
 * @file api/sse/common/streamGenerationCore.js
 * @description SSE 스트리밍 계층입니다. 회사 sse.js 기반 XHR POST SSE 수신, data frame 파싱, chunk commit, 모바일 lifecycle abort를 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {appendParsedEvents} from "@/api/sse/common/sseFrame";
import {SSE} from "@/api/sse/vendor/sse";
import {createChunkCommitter} from "@/api/sse/common/chunkCommitter";
import {createAbortError} from "@/api/sse/common/sseErrors";
import {resolveGenerationUrl} from "@/api/sse/common/streamRequest";

/**
 * [SSE 실제 수신 계층]
 * 이 프로젝트는 기본 EventSource가 아니라 회사 sse.js 방식의 XHR 기반 SSE를 사용합니다.
 * POST body, credentials, AbortController 연동이 필요하기 때문에 sse.js stream/close 래퍼를 사용합니다.
 *
 * 처리 순서:
 * - new SSE(generation.do, { method: "POST", payload })
 * - XHR onprogress에서 data frame 단위 분리
 * - appendParsedEvents()로 content/reasoning/[DONE] 반영
 * - chunkCommitter가 Vue 업데이트 빈도를 제어
 */

/**
 * 실제 generation.do SSE 요청을 실행하는 핵심 함수입니다.
 *
 * 이 프로젝트는 기본 EventSource가 아니라 회사 sse.js 방식의 XHR 기반 SSE를 사용합니다.
 * 그 이유는 질문 payload를 POST body로 전송하고, AbortController로 모바일/웹뷰
 * 백그라운드 전환 시 source.close()를 통해 스트림을 직접 중단해야 하기 때문입니다.
 *
 * 처리 순서:
 * 1. lifecycle을 설치해 모바일 Chrome/WebView의 hidden/pagehide 이벤트를 연결합니다.
 * 2. generation.do에 text/event-stream POST 요청을 보냅니다.
 * 3. sse.js가 XHR onprogress로 `data: ...\n\n` frame을 분리합니다.
 * 4. appendParsedEvents로 회사 delta 응답을 content/reasoning으로 누적합니다.
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
  let source = null; // 회사 sse.js 기반 XHR 스트림 인스턴스 보관 포인터
  let accumulated = ""; // 파싱 완료된 AI 답변 텍스트 원본을 누적 적체하는 동적 문자열 버퍼
  let reasonAccumulated = ""; // DeepSeek/o1 등 추론(Reasoning) 모델이 뱉어내는 생각의 단편 텍스트를 누적 적체하는 버퍼
  let completed = false;
  let settled = false;

  // lifecycle은 모바일 Chrome/WebView에서 background 전환, pagehide, close를 담당합니다.
  const cleanupLifecycle = lifecycle?.install?.({
    controller,
    getReader: () => null,
    getSource: () => source,
    getAccumulated: () => accumulated,
    flush: () =>
      Promise.all([
        committer.flush(accumulated),
        reasonCommitter.flush(reasonAccumulated),
      ]),
  });

  const requestId = payload?.requestId || payload?.request_id || payload?.msgId || "";

  const closeSource = () => {
    if (!source) return;
    source.close();
  };

  const abortListener = () => closeSource();
  controller?.signal?.addEventListener?.("abort", abortListener, {once: true});

  try {
    await new Promise((resolve, reject) => {
      const finishResolve = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const finishReject = (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      source = new SSE(resolveGenerationUrl(), {
        start: false,
        method: "POST",
        withCredentials: true,
        autoReconnect: false,
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        payload: JSON.stringify(payload || {}),
      });

      source.addEventListener("message", (event) => {
        try {
          if (controller?.signal?.aborted) {
            throw controller.signal.reason || createAbortError("Aborted");
          }

          const nextState = appendParsedEvents(
            [event.data],
            accumulated,
            reasonAccumulated
          );
          accumulated = nextState.accumulated;
          reasonAccumulated = nextState.reasonAccumulated;

          if (nextState.reasonChanged) {
            reasonCommitter.update(reasonAccumulated);
          }
          if (nextState.changed) {
            lifecycle?.onAccumulated?.({accumulated, committer});
          }
          if (nextState.done) {
            completed = true;
            finishResolve();
            closeSource();
          }
        } catch (error) {
          closeSource();
          finishReject(error);
        }
      });

      source.addEventListener("error", (event) => {
        const error = new Error(event?.message || event?.data || "generation stream failed");
        const status = event?.status || event?.responseCode;
        if (status) error.status = status;
        finishReject(error);
      });

      source.addEventListener("abort", () => {
        if (controller?.signal?.aborted) {
          finishReject(controller.signal.reason || createAbortError("Aborted"));
          return;
        }
        if (!completed) finishReject(createAbortError("generation stream aborted"));
      });

      source.addEventListener("readystatechange", () => {
        if (source?.readyState === SSE.CLOSED && !completed && !controller?.signal?.aborted) {
          finishResolve();
        }
      });

      source.addEventListener("load", () => {
        if (!completed) finishResolve();
      });

      source.stream();
    });

    // 마지막 frame이 schedule만 되고 아직 UI에 반영되지 않았을 수 있어 완료 전에 강제 반영합니다.
    await reasonCommitter.flush(reasonAccumulated);
    await committer.flush(accumulated);
    await onComplete?.({requestId});

    return {
      completed: true,
      requestId,
      accumulated,
      reasonAccumulated,
      runtimeType,
    };
  } catch (error) {
    await reasonCommitter.flush(reasonAccumulated);
    await committer.flush(accumulated);
    error.accumulated = accumulated;
    error.reasonAccumulated = reasonAccumulated;
    error.generationRequestId = requestId;
    throw error;
  } finally {
    controller?.signal?.removeEventListener?.("abort", abortListener);
    cleanupLifecycle?.();
    closeSource();
  }
}
