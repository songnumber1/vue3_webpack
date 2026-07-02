<template>
  <UserMessage
    v-if="message.role === 'user'"
    :data-message-id="message.id"
    :data-message-role="message.role"
    :message="message"
  />
  <AssistantErrorMessage
    v-else-if="isAssistantErrorMessage(message)"
    :data-message-id="message.id"
    :data-message-role="message.role"
    :message="message"
  />
  <AssistantMessage
    v-else
    :data-message-id="message.id"
    :data-message-role="message.role"
    :message="message"
    :show-regenerate="showRegenerate"
    :defer-mermaid-enhancement="deferMermaidEnhancement"
  />
</template>

<script setup>
/**
 * @file components/chat/ChatMessageRouter.vue
 * @description 채팅 UI 컴포넌트입니다. 메시지, 헤더, 입력 영역, 이미지 프리뷰 등 실제 화면 렌더를 담당합니다.
 */

import UserMessage from "./UserMessage.vue";
import AssistantMessage from "./AssistantMessage.vue";
import AssistantErrorMessage from "./AssistantErrorMessage.vue";

defineProps({
  message: {type: Object, required: true},
  showRegenerate: {type: Boolean, default: true},
  deferMermaidEnhancement: {type: Boolean, default: false},
});

function isAssistantErrorMessage(message) {
  return (
    message.role !== "user" &&
    (message.status === "error" || message.error === true)
  );
}
</script>
