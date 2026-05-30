<template>
  <ChatContainer>
    <template #default="{setWorkspaceRef}">
      <ChatSearchWorkspace :ref="setWorkspaceRef" />
    </template>
  </ChatContainer>
</template>

<script setup>
/**
 * @file views/search/ChatSearchPage.vue
 * @description 공통 ChatContainer 안에서 채팅 검색 전용 workspace를 표시합니다.
 */
import ChatContainer from "@/containers/chat/ChatContainer.vue";
import ChatSearchWorkspace from "@/components/search/ChatSearchWorkspace.vue";
</script>
