<template>
  <ChatContainer>
    <template #default="{setWorkspaceRef}">
      <ChatRoomWorkspace :ref="setWorkspaceRef" />
    </template>
  </ChatContainer>
</template>

<script setup>
/**
 * @file views/ChatPage.vue
 * @description 공통 AppShell(ChatContainer) 안에서 채팅방 workspace만 라우터가 직접 마운트합니다.
 */
import ChatContainer from "@/containers/chat/ChatContainer.vue";
import ChatRoomWorkspace from "@/components/workspace/ChatRoomWorkspace.vue";
</script>
