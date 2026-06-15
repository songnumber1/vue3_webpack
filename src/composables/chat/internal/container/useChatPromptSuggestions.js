/**
 * @file composables/chat/internal/container/useChatPromptSuggestions.js
 * @description Chat main 화면 추천 프롬프트를 현재 locale 기준 표시 데이터로 변환합니다.
 */

import {computed} from "vue";
import {PROMPT_SUGGESTION_LIMIT} from "@/constants/promptSuggestions";

export function useChatPromptSuggestions({currentExamplePrompts, locale}) {
  return computed(() => {
    const assistantPrompts = currentExamplePrompts.value || [];
    const isEnglish = locale.value === "en";

    return assistantPrompts
      .slice(0, PROMPT_SUGGESTION_LIMIT)
      .map((prompt) => {
        const localizedTitle = isEnglish
          ? prompt.titleEn || prompt.titleKo
          : prompt.titleKo || prompt.titleEn;
        const localizedContent = isEnglish
          ? prompt.contentEn || prompt.contentKo || localizedTitle
          : prompt.contentKo || prompt.contentEn || localizedTitle;

        const text = localizedTitle || localizedContent;
        const content = localizedContent || localizedTitle;

        return {
          id: prompt.id,
          text,
          title: content || text,
          prompt: content || text,
        };
      })
      .filter((item) => item.text && item.prompt);
  });
}
