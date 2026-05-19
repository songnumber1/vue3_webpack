<template>
  <ChatContainer mode="chat" />
</template>

<script setup>
import ChatContainer from "@/containers/chat/ChatContainer.vue";
</script>

<style scoped>
/* Scoped layout guard: keep component roots and flex/grid children shrink-safe. */
:where(*) {
  box-sizing: border-box;
  min-width: 0;
}
</style>
