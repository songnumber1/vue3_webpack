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
