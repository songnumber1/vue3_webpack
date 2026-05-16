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
      @select-assistant="$emit('select-assistant', $event)"
      @open-guide="$emit('open-guide')"
      @open-notice="$emit('open-notice')"
      @open-personalization="$emit('open-personalization')"
      @open-language="$emit('open-language')"
      @toggle-theme="$emit('toggle-theme')"
      @open-swagger="$emit('open-swagger')"
      @open-playground="$emit('open-playground')"
      @open-settings="$emit('open-settings')"
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
  "select-assistant",
  "open-guide",
  "open-notice",
  "open-personalization",
  "open-language",
  "toggle-theme",
  "open-swagger",
  "open-playground",
  "open-settings",
]);
</script>
