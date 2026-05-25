/**
 * @file composables/chat/useSharedChat.js
 * @description 채팅 도메인 composable입니다. 질문 전송, 메시지 동기화, SSE 결과 반영, scroll/overlay action을 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {createId} from "@/utils/id";

export async function loadSharedConversation(shareId) {
  const normalizedShareId = String(shareId || "").trim();

  return [
    {
      id: createId("message"),
      role: "user",
      content: `공유 URL로 전달된 대화입니다.\n\nshareId: ${normalizedShareId || "unknown"}`,
    },
    {
      id: createId("message"),
      role: "assistant",
      content:
        "이 화면은 공유 받은 대화 전용 읽기 모드입니다. 기존 채팅 화면과 동일한 메시지 레이아웃을 사용하지만 하단 입력 영역은 전송 가능한 입력창이 아니라 안내 영역으로 표시됩니다.",
    },
  ];
}
