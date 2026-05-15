<!--
@file ChatAssistantSheet.vue
@description Bottom sheet used to select the active Assistant profile.
@author OpenAI
-->

<template>
  <BaseBottomSheet :open="open" title="Assistant 선택" @close="$emit('close')">
    <button
      v-for="assistant in assistants"
      :key="assistant.id"
      class="bottom-sheet-option"
      :class="{ active: assistant.id === selectedAssistantId }"
      type="button"
      @click="$emit('select', assistant.id)"
    >
      <span class="bottom-sheet-option-main">
        <strong>{{ assistant.label }}</strong>
        <small>{{ assistant.description }}</small>
      </span>
      <CheckIcon
        v-if="assistant.id === selectedAssistantId"
        class="bottom-sheet-check"
      />
    </button>
  </BaseBottomSheet>
</template>

<script setup>
import BaseBottomSheet from "./BaseBottomSheet.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";

defineProps({
  open: { type: Boolean, default: false },
  assistants: { type: Array, default: () => [] },
  selectedAssistantId: { type: String, default: "" },
});

defineEmits(["close", "select"]);
</script>
