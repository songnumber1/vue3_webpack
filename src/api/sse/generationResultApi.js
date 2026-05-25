/**
 * @file api/sse/generationResultApi.js
 * @description SSE 스트리밍 계층입니다. fetch ReadableStream, data: frame 파싱, chunk commit, 모바일 lifecycle abort를 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {resolveGenerationResultUrl} from "@/api/sse/common/streamRequest";

/**
 * @description SSE 스트리밍이 종료되거나 중도 차단된 이후, 백엔드에 안전하게 적체 완료된 최종 AI 생성 결과물(텍스트, 메타데이터 등)을 HTTP GET 통신으로 확정 조회해오는 비동기 데이터 패치 함수입니다.
 * @param {string} requestId - 결과를 조회하고자 하는 해당 채팅 세션의 고유 생성 요청 식별자 (Request ID)
 * @returns {Promise<object|null>} 백엔드로부터 수신한 JSON 결과 객체 데이터 (통신 실패 혹은 식별자 누락 시 `null` 반환)
 */
export async function fetchGenerationResult(requestId) {
  // 인라인 가드 분기: 요청 식별자(requestId)가 올바르게 인입되지 않은 유효하지 않은 호출인 경우 통신을 발생시키지 않고 즉각 탈출
  if (!requestId) return null;

  // 동적 URL 해제 함수를 경유하여 해당 세션의 최종 엔드포인트로 HTTP GET 요청 집행
  const response = await fetch(resolveGenerationResultUrl(requestId), {
    method: "GET", // 단방향 최종 스냅샷 데이터 조회를 위한 GET 메서드 명시
    credentials: "include", // 세션 인증 유지를 위해 크로스 오리진 환경에서도 인증 쿠키 및 자격 증명을 포함하여 전송
    headers: {
      Accept: "application/json", // 스트리밍 포맷(text/event-stream)이 아닌, 가공이 완료된 표준 JSON 형태의 응답을 요구
      "Cache-Control": "no-cache", // 중간 네트워크 노드 및 브라우저에 의한 과거 결과 데이터의 악성 캐싱을 방어
    },
  });

  // 네트워크 통신 실패 가드: 응답 상태 코드가 2xx 계열이 아니거나 서버 크래시가 발생한 경우 예외를 터뜨리지 않고 방어적으로 `null` 반환
  if (!response.ok) return null;

  // HTTP 내부 바디의 JSON 스트링 데이터를 자바스크립트 객체(Object) 형식으로 언마샬링하여 최종 반환
  return response.json();
}
