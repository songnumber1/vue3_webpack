<template>
  <ChatContainer workspace="conversation" />
</template>

<script setup>
/**
 * @file views/SharedPage.vue
 * @description 공유 대화방 라우트 진입점입니다. 공유/읽기 전용 상태는 ChatContainer의 routeMode가 결정합니다.
 */
import ChatContainer from "@/containers/chat/ChatContainer.vue";
</script>
