<!--
@file SharedPage.vue
@description Shared conversation route that reuses the chat UI in read-only mode.
@author OpenAI
-->

<template>
  <ChatShell mode="shared" />
</template>

<script setup>
import ChatShell from "@/components/chat/ChatShell.vue";
</script>
