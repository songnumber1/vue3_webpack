<template>
  <UserMessage
    v-if="message.role === 'user'"
    :message="message"
    @rendered="$emit('rendered')"
  />
  <AssistantMessage
    v-else
    :message="message"
    @rendered="$emit('rendered')"
    @regenerate="$emit('regenerate', $event)"
  />
</template>

<script setup>
import UserMessage from "./UserMessage.vue";
import AssistantMessage from "./AssistantMessage.vue";
defineProps({
  message: {type: Object, required: true},
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
