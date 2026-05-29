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
import {watch} from "vue";
import ChatContainer from "@/containers/chat/ChatContainer.vue";
import StudioWorkspace from "@/components/workspace/StudioWorkspace.vue";
import {storeToRefs} from "pinia";
import {useAssistantStore} from "@/stores/assistantStore";

const ASSISTANT_STUDIO_PORTAL_ID = "assistant-studio";
const assistantStore = useAssistantStore();
const {assistants} = storeToRefs(assistantStore);

watch(
  assistants,
  () => {
    if (assistantStore.assistantMap[ASSISTANT_STUDIO_PORTAL_ID]) {
      assistantStore.selectAssistant(ASSISTANT_STUDIO_PORTAL_ID);
    }
  },
  {immediate: true}
);
</script>
