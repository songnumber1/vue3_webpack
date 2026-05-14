/** * @file ChatMessage.vue * @description Vue component used in the chat web
application runtime. * @author OpenAI */

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
defineProps({message: {type: Object, required: true}});
defineEmits(["rendered"]);
</script>
