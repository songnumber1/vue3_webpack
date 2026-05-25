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
import {
  createAbortError,
  isGenerationAbortError,
} from "@/api/sse/common/sseErrors";
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
  let reader = null; // 스트림 청크 리더 인스턴스를 보관하기 위해 상위 레벨 변수로 앵커 선언
  let accumulated = ""; // 파싱 완료된 AI 답변 텍스트 원본을 누적 적체하는 동적 문자열 버퍼
  let reasonAccumulated = ""; // DeepSeek/o1 등 추론(Reasoning) 모델이 뱉어내는 생각의 단편 텍스트를 누적 적체하는 버퍼

  // lifecycle은 모바일 Chrome/WebView에서 background 전환, pagehide, reader cancel을 담당합니다.
  const cleanupLifecycle = lifecycle?.install?.({
    controller,
    getReader: () => reader,
    getAccumulated: () => accumulated,
    flush: () =>
      Promise.all([
        committer.flush(accumulated),
        reasonCommitter.flush(reasonAccumulated),
      ]),
  });

  try {
    // EventSource가 아닌 fetch stream이므로 POST body와 AbortController를 모두 사용할 수 있습니다.
    const response = await fetch(resolveGenerationUrl(), {
      method: "POST", // 질문 JSON 구조를 큰 규격으로 밀어 넣기 위한 HTTP POST 사양 정의
      credentials: "include", // 크로스 오리진 상황에서도 쿠키/세션 상태를 자동 공유 보장
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream", // 서버 측에 SSE 청크 스트리밍 포맷 패킷 반환을 요구하는 헤더 마킹
        "Cache-Control": "no-cache", // 중간 네트워크 프록시 노드 및 브라우저의 악성 응답 캐싱 행위 전면 차단
      },
      body: JSON.stringify(payload),
      signal: controller?.signal, // 생성부 외부에서 발행된 중단 시그널 유선 동기화 결합
    });

    if (!response.ok) {
      throw new Error(`generation stream failed: ${response.status}`); // 400, 500 계열 통신 크래시 시 예외 분기로 리다이렉션
    }
    if (!response.body) {
      throw new Error("generation stream body is empty"); // 네트워크 바디가 Nullish 상태로 인입되었을 때 인라인 방어 가드
    }

    // ReadableStream reader로 서버가 밀어주는 SSE byte chunk를 순차적으로 읽습니다.
    reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8"); // 바이트 어레이 스트림 데이터를 UTF-8 유니코드 텍스트 문자로 해독하는 네이티브 디코더 빌드
    let buffer = ""; // 네트워크에서 조각조각 잘려 인입되는 프레임 원시 문자열을 가두는 임시 링 버퍼
    let done = false; // 스트림 루프 폐쇄 여부를 가리키는 런타임 종결 플래그

    while (!done) {
      if (controller?.signal?.aborted) {
        throw controller.signal.reason || createAbortError("Aborted"); // 루프 회전 직전, 외부 원격 제어로 차단 요청이 들어왔는지 수시 스냅샷 검증
      }

      const result = await reader.read(); // 다음 바이트 청크 락이 해제되어 스트림 버퍼가 인입될 때까지 비동기 커널 대기
      done = result.done; // 백엔드가 연결을 정상 소멸시켰거나 데이터 방출을 완수했는지 유무 최신화

      if (result.value) {
        buffer += decoder.decode(result.value, {stream: true}); // 가변 청크 바이트 슬라이스를 기존 임시 버퍼 후미에 디코딩 연쇄 결합
      }

      if (done) {
        buffer += decoder.decode(); // 스트림 완전 종료 시점에 해독기 내부 스트림에 잔존해 있던 미출력 잔여 비트 패킷까지 영혼까지 끌어모아 탈탈 털어냄
      }

      // buffer에는 frame이 중간에서 잘린 문자열이 들어올 수 있으므로 rest를 다음 read까지 보관합니다.
      const parsed = parseSseBuffer(buffer);
      buffer = parsed.rest; // 줄바꿈 기호('\n\n')가 유실되어 미처 완성되지 못하고 잘린 다음 프레임 후보군 조각을 다음 회차 루프용 버퍼 포인터에 보존

      // data frame을 답변(content), 추론(reason), 완료([DONE]) 상태로 누적 변환합니다.
      const nextState = appendParsedEvents(
        parsed.events,
        accumulated,
        reasonAccumulated
      );
      accumulated = nextState.accumulated; // 내부 프레임 누적 가공 상태가 반영된 텍스트 본체 필드로 메모리 동기화
      reasonAccumulated = nextState.reasonAccumulated; // 추론 모델 전용 누적 데이터 최신 상태 동기화

      if (nextState.done) done = true; // 서버가 명시적으로 명세서 상의 `[DONE]` 플래그 프레임을 쏘아 보낸 경우 비동기 루프 전격 종결 선언
      if (nextState.reasonChanged) {
        reasonCommitter.update(reasonAccumulated); // 생각 프로세스 텍스트 영역에 신규 파편 변동 발생 시 스케줄러 큐에 트리거 투척
      }
      if (nextState.changed) {
        lifecycle?.onAccumulated?.({accumulated, committer}); // 본문 렌더링 영역 변경 시 현재 브라우저(데스크톱/모바일 크롬) 라이프사이클 락 상태를 경유하여 업데이트 처리
      }
    }

    // 마지막 frame이 schedule만 되고 아직 UI에 반영되지 않았을 수 있어 완료 전에 강제 반영합니다.
    await reasonCommitter.flush(reasonAccumulated);
    await committer.flush(accumulated);
    await onComplete?.({
      requestId: payload?.requestId || payload?.request_id || "",
    }); // 상위 비즈니스 로직에 정상 스트리밍 세션 완수 증적 전파

    return {
      completed: true, // 생성 가동 완수 확인 증적 태그
      requestId: payload?.requestId || payload?.request_id || "", // 추적 추적성을 위한 고유 식별자 복귀 반환
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
    throw error; // 프론트엔드 공통 에러 경계 레이어 및 상위 Catch 블록으로 가공된 예외 컨텍스트 폭탄 패스 던짐
  } finally {
    cleanupLifecycle?.(); // 컴포넌트 마운트 해제 및 브라우저 이벤트 버스에 결합했던 모바일 복귀/은닉 가드 리스너 채널 전격 철거

    // Abort 이후 reader가 살아있으면 네트워크 리소스가 남을 수 있어 한 번 더 cancel합니다.
    if (reader && controller?.signal?.aborted) {
      await reader.cancel(controller.signal.reason).catch((error) => {
        if (!isGenerationAbortError(error)) {
          logWarn("[streamGeneration] reader cleanup failed:", error); // 무시해도 좋은 일반 중단 에러가 아닐 때만 하드웨어 누수 디버깅 로그 표출
        }
      });
    }
  }
}
