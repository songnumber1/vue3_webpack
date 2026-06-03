<template>
  <div
    class="chat-container chat-container-root tw-grid tw-h-full tw-min-h-0 tw-w-full tw-grid-cols-[minmax(0,1fr)] tw-grid-rows-[56px_minmax(0,1fr)_38px] tw-overflow-hidden tw-bg-app-chat tw-text-app-text"
    :class="{
      'chat-container-root--keyboard-open': keyboardOpen,
      [`chat-container-root--mode-${mode}`]: true,
      'chat-container-root--sidebar-collapsed': sidebarCollapsed,
    }"
  >
    <ApplicationHeader />

    <div
      class="application-body tw-min-h-0 tw-min-w-0 tw-overflow-hidden tw-bg-app-chat"
      aria-label="Application body"
    >
      <AppSidebar />
      <main class="chat-workspace tw-min-h-0 tw-min-w-0 tw-overflow-hidden">
        <slot />
      </main>
    </div>

    <ApplicationFooter />
  </div>
</template>

<script setup>
/**
 * @file components/chat/ChatLayout.vue
 * @description 채팅 화면의 최상위 frame입니다.
 * PC에서는 application header/body/footer 3단 grid를 구성하고,
 * 모바일에서는 기존처럼 application chrome을 숨긴 뒤 sidebar + chat workspace 구조를 유지합니다.
 */

import {storeToRefs} from "pinia";
import AppSidebar from "@/components/navigation/AppSidebar.vue";
import ApplicationHeader from "@/components/layout/ApplicationHeader.vue";
import ApplicationFooter from "@/components/layout/ApplicationFooter.vue";
import {useNavigationStore} from "@/stores/navigationStore";

const navigationStore = useNavigationStore();
const {sidebarCollapsed} = storeToRefs(navigationStore);

defineProps({
  keyboardOpen: {type: Boolean, default: false},
  mode: {type: String, default: "main"},
});
</script>
