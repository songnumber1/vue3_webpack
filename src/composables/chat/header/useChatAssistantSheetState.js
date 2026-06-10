/**
 * @file composables/chat/header/useChatAssistantSheetState.js
 * @description ChatHeader와 ChatContainer가 공유하는 Assistant 선택 sheet 상태입니다.
 */

import {ref} from "vue";

const assistantSheetOpen = ref(false);

export function useChatAssistantSheetState() {
  function openAssistantSheet() {
    assistantSheetOpen.value = true;
  }

  function closeAssistantSheet() {
    assistantSheetOpen.value = false;
  }

  function toggleAssistantSheet() {
    assistantSheetOpen.value = !assistantSheetOpen.value;
  }

  return {
    assistantSheetOpen,
    openAssistantSheet,
    closeAssistantSheet,
    toggleAssistantSheet,
  };
}
