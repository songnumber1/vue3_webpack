<template>
  <ChatContainer workspace="mcp" />
</template>

<script setup>
/**
 * @file views/mcp/McpConnectorListPage.vue
 * @description 공통 AppShell(ChatContainer) 안에서 Connector Store workspace를 마운트합니다.
 */
import {watch} from "vue";
import {storeToRefs} from "pinia";
import ChatContainer from "@/containers/chat/ChatContainer.vue";
import {useChatStore} from "@/stores/chatStore";
import {ASSISTANT_PORTAL_IDS} from "@/constants/assistantPortal";

const CONNECTOR_STORE_PORTAL_ID = ASSISTANT_PORTAL_IDS.CONNECTOR_STORE;
const chatStore = useChatStore();
const {assistants} = storeToRefs(chatStore);

watch(
  assistants,
  () => {
    if (chatStore.assistantMap[CONNECTOR_STORE_PORTAL_ID]) {
      chatStore.selectAssistant(CONNECTOR_STORE_PORTAL_ID);
    }
  },
  {immediate: true}
);
</script>
