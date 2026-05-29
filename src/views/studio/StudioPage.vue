<template>
  <ChatContainer>
    <template #default="{setWorkspaceRef}">
      <StudioWorkspace :ref="setWorkspaceRef" />
    </template>
  </ChatContainer>
</template>

<script setup>
/**
 * @file views/studio/StudioPage.vue
 * @description 공통 AppShell(ChatContainer) 안에서 Studio workspace만 라우터가 직접 마운트합니다.
 */
import ChatContainer from "@/containers/chat/ChatContainer.vue";
import StudioWorkspace from "@/components/workspace/StudioWorkspace.vue";
</script>
