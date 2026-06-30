<template>
  <div
    class="chat-container chat-container-root tw-grid tw-h-full tw-min-h-0 tw-w-full tw-grid-cols-[minmax(0,1fr)] tw-grid-rows-[minmax(0,1fr)] tw-overflow-hidden tw-bg-app-chat tw-text-app-text"
    :class="{
      'chat-container-root--keyboard-open': keyboardOpen,
      [`chat-container-root--mode-${mode}`]: true,
    }"
  >
    <AppSidebar />
    <main class="chat-workspace tw-min-h-0 tw-min-w-0 tw-overflow-hidden">
      <slot />
    </main>
  </div>
</template>

<script setup>
/**
 * @file components/chat/ChatLayout.vue
 * @description 모바일 전용 채팅 layout입니다.
 */

import AppSidebar from "@/components/navigation/AppSidebar.vue";


defineProps({
  keyboardOpen: {type: Boolean, default: false},
  mode: {type: String, default: "main"},
});
</script>
