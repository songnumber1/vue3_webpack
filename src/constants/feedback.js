/**
 * @file constants/feedback.js
 * @description 여러 계층에서 공유하는 상수 모음입니다. UI/런타임/이미지/설정 값의 단일 출처 역할을 합니다.
 */

export const FEEDBACK_ACTIONS = {
  LIKE: "like",
  DISLIKE: "dislike",
  SEND: "send",
  COPY: "copy",
};

export const HALLUCINATION_REASONS = [
  {
    id: "incorrect-information",
    ko: "AI가 부정확한 정보를 제공함",
    en: "Incorrect information provided by the AI.",
    default: true,
  },
  {
    id: "missing-context",
    ko: "질문 맥락을 잘못 이해함",
    en: "The AI misunderstood the question context.",
    default: true,
  },
  {
    id: "unsupported-source",
    ko: "근거 또는 출처가 부족함",
    en: "The answer lacks supporting sources.",
    default: true,
  },
  {
    id: "outdated-answer",
    ko: "오래된 정보로 답변함",
    en: "The answer uses outdated information.",
    default: true,
  },
  {
    id: "wrong-code",
    ko: "코드 예제가 동작하지 않음",
    en: "The code example does not work.",
    default: false,
  },
  {
    id: "unsafe-suggestion",
    ko: "운영 환경에 위험한 제안이 포함됨",
    en: "The answer includes risky production advice.",
    default: false,
  },
  {
    id: "formatting-issue",
    ko: "표, 코드, 수식 등 표현이 깨짐",
    en: "Tables, code, math, or formatting are broken.",
    default: false,
  },
];
