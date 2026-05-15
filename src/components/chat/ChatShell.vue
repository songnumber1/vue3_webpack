<!--
@file ChatShell.vue
@description Backward-compatible wrapper. Use containers/chat/ChatContainer.vue for new code.
-->

<template>
  <ChatContainer :mode="mode" />
</template>

<script setup>
import ChatContainer from "@/containers/chat/ChatContainer.vue";

defineProps({mode: {type: String, default: "main"}});
</script>
