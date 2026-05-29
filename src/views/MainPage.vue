<template>
  <ChatContainer>
    <template #default="{setWorkspaceRef}">
      <MainWorkspace :ref="setWorkspaceRef" />
    </template>
  </ChatContainer>
</template>

<script setup>
/**
 * @file views/MainPage.vue
 * @description 공통 AppShell(ChatContainer) 안에서 메인 workspace만 라우터가 직접 마운트합니다.
 */
import ChatContainer from "@/containers/chat/ChatContainer.vue";
import MainWorkspace from "@/components/workspace/MainWorkspace.vue";
</script>
