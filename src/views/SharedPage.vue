<!--
@file SharedPage.vue
@description Shared conversation route that reuses the chat UI in read-only mode.
@author OpenAI
-->

<template>
  <ChatContainer mode="shared" />
</template>

<script setup>
import ChatContainer from "@/containers/chat/ChatContainer.vue";
</script>
