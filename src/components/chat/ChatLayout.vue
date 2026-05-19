<template>
  <div
    class="chat-container chat-container-root"
    :class="{
      'chat-container-root--keyboard-open': keyboardOpen,
      [`chat-container-root--mode-${mode}`]: true,
      'chat-container-root--sidebar-collapsed': sidebarCollapsed,
    }"
  >
    <AppSidebar
      @new-chat="$emit('new-chat')"
      @select-history="$emit('select-history', $event)"
      @history-menu-action="$emit('history-menu-action', $event)"
      @select-assistant="$emit('select-assistant', $event)"
    />

    <main class="chat-workspace">
      <slot />
    </main>
  </div>
</template>

<script setup>
import {storeToRefs} from "pinia";
import AppSidebar from "@/components/navigation/AppSidebar.vue";
import {useNavigationStore} from "@/stores/navigationStore";

const navigationStore = useNavigationStore();
const {sidebarCollapsed} = storeToRefs(navigationStore);

defineProps({
  keyboardOpen: {type: Boolean, default: false},
  mode: {type: String, default: "main"},
});

defineEmits([
  "new-chat",
  "select-history",
  "history-menu-action",
  "select-assistant",
]);
</script>

<style scoped>
/* Component-local styles should stay scoped. */
</style>
