/**
 * @file api/sse/generationResultApi.js
 * @description SSE 스트리밍 계층입니다. fetch ReadableStream, data: frame 파싱, chunk commit, 모바일 lifecycle abort를 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {resolveGenerationResultUrl} from "@/api/sse/common/streamRequest";

export async function fetchGenerationResult(requestId) {
  if (!requestId) return null;

  const response = await fetch(resolveGenerationResultUrl(requestId), {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) return null;
  return response.json();
}
