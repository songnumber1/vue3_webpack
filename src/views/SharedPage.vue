<template>
  <ChatContainer>
    <template #default="{setWorkspaceRef}">
      <ChatConversationWorkspace :ref="setWorkspaceRef" />
    </template>
  </ChatContainer>
</template>

<script setup>
/**
 * @file views/SharedPage.vue
 * @description 공유 URL 진입 후 일반 채팅 화면과 동일한 workspace를 렌더링합니다.
 *
 * 공유방은 routeMode(shared)와 activeRoomType을 기준으로 조회 전용으로 동작합니다.
 * ChatContainer만 렌더링하면 실제 메시지 workspace slot이 비어 공유 메시지가 표시되지 않을 수 있으므로,
 * ChatPage와 동일하게 ChatConversationWorkspace를 slot으로 전달합니다.
 */

import ChatContainer from "@/containers/chat/ChatContainer.vue";
import ChatConversationWorkspace from "@/components/workspace/ChatConversationWorkspace.vue";
</script>
