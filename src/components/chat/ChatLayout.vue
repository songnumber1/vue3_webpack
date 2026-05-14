<!--
@file ChatLayout.vue
@description Chat page layout that owns sidebar placement and exposes workspace as a slot.
@author OpenAI
-->

<template>
  <div
    class="chatgpt-shell"
    :class="{
      'chatgpt-shell--keyboard-open': keyboardOpen,
      'chatgpt-shell--sidebar-collapsed': sidebarCollapsed
    }"
  >
    <ChatSidebar
      :histories="histories"
      :assistants="assistants"
      :selected-assistant-id="selectedAssistantId"
      :active-history-id="activeHistoryId"
      :sidebar-collapsed="sidebarCollapsed"
      :drawer-open="drawerOpen"
      :collapsed-recent-open="collapsedRecentOpen"
      @update:selected-assistant-id="$emit('update:selectedAssistantId', $event)"
      @update:sidebar-collapsed="$emit('update:sidebarCollapsed', $event)"
      @update:drawer-open="$emit('update:drawerOpen', $event)"
      @update:collapsed-recent-open="$emit('update:collapsedRecentOpen', $event)"
      @new-chat="$emit('new-chat')"
      @select-history="$emit('select-history', $event)"
      @select-history-collapsed="$emit('select-history', $event)"
    />

    <main class="chat-workspace">
      <slot />
    </main>
  </div>
</template>

<script setup>
import ChatSidebar from "./ChatSidebar.vue";

defineProps({
  histories: { type: Array, required: true },
  assistants: { type: Array, required: true },
  selectedAssistantId: { type: String, required: true },
  activeHistoryId: { type: [String, Number], default: null },
  sidebarCollapsed: { type: Boolean, default: false },
  drawerOpen: { type: Boolean, default: false },
  collapsedRecentOpen: { type: Boolean, default: false },
  keyboardOpen: { type: Boolean, default: false }
});

defineEmits([
  "update:selectedAssistantId",
  "update:sidebarCollapsed",
  "update:drawerOpen",
  "update:collapsedRecentOpen",
  "new-chat",
  "select-history"
]);
</script>
