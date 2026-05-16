<template>
  <UserMessage
    v-if="message.role === 'user'"
    :message="message"
    @rendered="$emit('rendered')"
  />
  <AssistantMessage v-else :message="message" @rendered="$emit('rendered')" />
</template>

<script setup>
import UserMessage from "./UserMessage.vue";
import AssistantMessage from "./AssistantMessage.vue";
// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
defineProps({message: {type: Object, required: true}});
defineEmits(["rendered"]);
</script>
