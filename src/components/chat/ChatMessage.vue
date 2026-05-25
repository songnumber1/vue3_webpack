<template>
  <UserMessage
    v-if="message.role === 'user'"
    :data-message-id="messageDomId"
    :data-message-role="messageDomRole"
    :message="message"
    @rendered="$emit('rendered')"
  />
  <AssistantMessage
    v-else
    :data-message-id="messageDomId"
    :data-message-role="messageDomRole"
    :message="message"
    @rendered="$emit('rendered')"
    @regenerate="$emit('regenerate', $event)"
  />
</template>

<script setup>
/**
 * @file components/chat/ChatMessage.vue
 * @description 채팅 UI 컴포넌트입니다. 메시지, 헤더, 입력 영역, 이미지 프리뷰 등 실제 화면 렌더를 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import UserMessage from "./UserMessage.vue";
import AssistantMessage from "./AssistantMessage.vue";

defineProps({
  message: {type: Object, required: true},
  messageDomId: {type: String, default: ""},
  messageDomRole: {type: String, default: ""},
});
defineEmits(["rendered", "regenerate"]);
</script>

<style scoped>
.message {
  min-width: 0;
}

.bubble {
  min-width: 0;
}
</style>
