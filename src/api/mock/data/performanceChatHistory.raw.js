/**
 * @file api/mock/data/performanceChatHistory.raw.js
 * @description 채팅방 이력 렌더링 성능 테스트용 대형 mock 채팅방 목록입니다.
 */

export const PERFORMANCE_CHAT_HISTORY_RAW = [
  {
    chatTitle: "공유 - 성능 테스트 250개 질의답변 + Mermaid",
    chatId: "perf-chat-qa-250",
    modeId: "model-ds-fast",
    modelId: "model-ds-fast",
    bookmarkYN: false,
    dayGroup: 0,
    chatEndDt: "2026-06-02T09:00:00Z",
    userId: "user-1234",
    sharedId: "e4511773-5706-46cb-a808-6cb6a83a1631",
    testPairCount: 250,
    testMessageCount: 500,
  },
  {
    chatTitle: "공유 - 성능 테스트 375개 질의답변 + Mermaid",
    chatId: "perf-chat-qa-375",
    modeId: "model-ds-fast",
    modelId: "model-ds-fast",
    bookmarkYN: false,
    dayGroup: 0,
    chatEndDt: "2026-06-02T10:00:00Z",
    userId: "user-1234",
    sharedId: "7b64cd61-4d77-46df-9d45-d50122b1d461",
    testPairCount: 375,
    testMessageCount: 750,
  },
  {
    chatTitle: "성능 테스트 500개 질의답변 + Mermaid",
    chatId: "perf-chat-qa-500",
    modeId: "model-ds-fast",
    modelId: "model-ds-fast",
    bookmarkYN: false,
    dayGroup: 0,
    chatEndDt: "2026-06-02T11:00:00Z",
    userId: "user-1234",
    // sharedId: "4ee53a45-a3b4-493d-8728-1b31a7e2d7c9",
    testPairCount: 500,
    testMessageCount: 1000,
  },
];
