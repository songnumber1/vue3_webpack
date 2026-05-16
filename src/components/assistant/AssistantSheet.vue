<!--
@file AssistantSheet.vue
@description Bottom sheet used to select the active Assistant profile.
@author OpenAI
-->

<template>
  <BaseBottomSheet :open="open" title="Assistant 선택" @close="$emit('close')">
    <button
      v-for="assistant in assistants"
      :key="assistant.id"
      class="bottom-sheet-option"
      :class="{active: assistant.id === selectedAssistantId}"
      type="button"
      @click="$emit('select', assistant.id)"
    >
      <span class="bottom-sheet-option-main">
        <strong>{{ assistant.label }}</strong>
        <small>{{ assistant.description }}</small>
      </span>
      <span
        v-if="assistant.id === selectedAssistantId"
        class="bottom-sheet-selected-indicator"
        aria-label="현재 선택된 값"
      >
        <CheckIcon class="bottom-sheet-check" />
        <span class="sr-only">현재 선택된 값</span>
      </span>
    </button>
  </BaseBottomSheet>
</template>

<script setup>
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";

defineProps({
  open: {type: Boolean, default: false},
  assistants: {type: Array, default: () => []},
  selectedAssistantId: {type: String, default: ""},
});

defineEmits(["close", "select"]);
</script>
