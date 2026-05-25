/**
 * @file api/mock/data/accessInfo.raw.js
 * @description 개발/데모용 mock API 또는 mock 데이터입니다. 실제 API 비활성화 시 화면 동작을 보장합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export const ACCESS_INFO_RAW = {
  valid: null,
  entryType: "main",
  chatId: null,
  intentionKeyList: [
    {val: 0, key: "intention"},
    {val: true, key: "isRAG"},
    {val: false, key: "isRagCot"},
    {val: "internal", key: "source"},
    {val: 0, key: "language"},
    {val: 0, key: "style"},
    {val: 0, key: "length"},
    {val: 0, key: "web"},
    {val: "", key: "sender"},
    {val: "", key: "receiver"},
  ],
  sourceOptions: ["internal", "external"],
  externalOptions: [
    {alias: "perplexity", kor: "퍼블렉시티", eng: "Perplexity"},
  ],
  user: {
    userId: "user-1234",
    userName: "민우 송",
    adminType: "ADMIN",
    presetInfo: {
      language: "ko",
      assist: {
        "assist-ds": "model-ds-thinking",
        "assist-code": "model-code-pro",
        "studio-marketing": "studio-model-marketing-a",
      },
      template: {
        0: {
          intention: 0,
          isRAG: true,
          isRagCot: false,
          source: "internal",
          language: 0,
          style: 0,
          length: 0,
          web: 0,
          sender: "",
          receiver: "",
        },
        2: {
          intention: 2,
          isRAG: false,
          isRagCot: false,
          source: "",
          language: 0,
          style: 0,
          length: 0,
          web: 0,
          sender: "",
          receiver: "",
        },
        3: {
          intention: 3,
          isRAG: false,
          isRagCot: false,
          source: "",
          language: 0,
          style: 1,
          length: 2,
          web: 0,
          sender: "",
          receiver: "",
        },
      },
    },
    latestLnb: "chat-md-showcase",
  },
  isRagAuth: true,
};
