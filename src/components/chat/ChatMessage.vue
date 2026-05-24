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
