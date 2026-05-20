<template>
  <UserMessage
    v-if="message.role === 'user'"
    :message="message"
    :interaction-blocked="interactionBlocked"
    @rendered="$emit('rendered')"
  />
  <AssistantMessage
    v-else
    :message="message"
    :interaction-blocked="interactionBlocked"
    @rendered="$emit('rendered')"
  />
</template>

<script setup>
import UserMessage from "./UserMessage.vue";
import AssistantMessage from "./AssistantMessage.vue";
defineProps({
  message: {type: Object, required: true},
  interactionBlocked: {type: Boolean, default: false},
});
defineEmits(["rendered"]);
</script>

<style scoped>
.message {
  min-width: 0;
}

.bubble {
  min-width: 0;
}
</style>
