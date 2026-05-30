<template>
  <ChatContainer>
    <template #default="{setWorkspaceRef}">
      <McpWorkspace :ref="setWorkspaceRef" />
    </template>
  </ChatContainer>
</template>

<script setup>
/**
 * @file views/mcp/ConnectorStorePage.vue
 * @description 공통 AppShell(ChatContainer) 안에서 Connector Store workspace를 마운트합니다.
 */
import {watch} from "vue";
import {storeToRefs} from "pinia";
import ChatContainer from "@/containers/chat/ChatContainer.vue";
import McpWorkspace from "@/components/workspace/McpWorkspace.vue";
import {useAssistantStore} from "@/stores/assistantStore";

const CONNECTOR_STORE_PORTAL_ID = "connector-store";
const assistantStore = useAssistantStore();
const {assistants} = storeToRefs(assistantStore);

watch(
  assistants,
  () => {
    if (assistantStore.assistantMap[CONNECTOR_STORE_PORTAL_ID]) {
      assistantStore.selectAssistant(CONNECTOR_STORE_PORTAL_ID);
    }
  },
  {immediate: true}
);
</script>
