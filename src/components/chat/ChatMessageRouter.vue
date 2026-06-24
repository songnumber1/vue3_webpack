<template>
  <UserMessage
    v-if="message.role === 'user'"
    :data-message-id="messageDomId"
    :data-message-role="messageDomRole"
    :message="message"
    @rendered="$emit('rendered', $event)"
  />
  <AssistantErrorMessage
    v-else-if="isErrorMessage"
    :data-message-id="messageDomId"
    :data-message-role="messageDomRole"
    :message="message"
    @rendered="$emit('rendered', $event)"
  />
  <AssistantMessage
    v-else
    :data-message-id="messageDomId"
    :data-message-role="messageDomRole"
    :message="message"
    :show-regenerate="showRegenerate"
    :defer-mermaid-enhancement="deferMermaidEnhancement"
    @rendered="$emit('rendered', $event)"
    @regenerate="$emit('regenerate', $event)"
  />
</template>

<script setup>
/**
 * @file components/chat/ChatMessageRouter.vue
 * @description 채팅 UI 컴포넌트입니다. 메시지, 헤더, 입력 영역, 이미지 프리뷰 등 실제 화면 렌더를 담당합니다.
 */

import {computed} from "vue";
import UserMessage from "./UserMessage.vue";
import AssistantMessage from "./AssistantMessage.vue";
import AssistantErrorMessage from "./AssistantErrorMessage.vue";

const props = defineProps({
  message: {type: Object, required: true},
  messageDomId: {type: String, default: ""},
  messageDomRole: {type: String, default: ""},
  showRegenerate: {type: Boolean, default: true},
  deferMermaidEnhancement: {type: Boolean, default: false},
});
defineEmits(["rendered", "regenerate"]);

const isErrorMessage = computed(
  () =>
    props.message?.role !== "user" &&
    (props.message?.status === "error" || props.message?.error === true)
);
</script>
