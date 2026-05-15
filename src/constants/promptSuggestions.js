/**
 * @file promptSuggestions.js
 * @description JavaScript module for promptSuggestions.
 */

export const PROMPT_SUGGESTION_TYPES = {
  IMAGE: "image",
  WRITING: "writing",
  SEARCH: "search",
};

export const PROMPT_SUGGESTION_DEFINITIONS = [
  {
    id: PROMPT_SUGGESTION_TYPES.IMAGE,
    icon: "▧",
    labelKey: "chat.suggestions.image",
    fallbackPrompt: "이미지 생성 또는 이미지 설명에 필요한 프롬프트를 만들어줘",
  },
  {
    id: PROMPT_SUGGESTION_TYPES.WRITING,
    icon: "✎",
    labelKey: "chat.suggestions.writing",
    fallbackPrompt: "아래 내용을 더 자연스럽고 명확하게 다듬어줘",
  },
  {
    id: PROMPT_SUGGESTION_TYPES.SEARCH,
    icon: "◎",
    labelKey: "chat.suggestions.search",
    fallbackPrompt: "현재 상황에서 빠진 항목과 확인해야 할 항목을 찾아줘",
  },
];
