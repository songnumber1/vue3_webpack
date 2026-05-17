<template>
  <BaseBottomSheet :open="open" :title="t('chat.assistantSelect')" @close="$emit('close')">
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
        :aria-label="t('chat.assistantSelected')"
      >
        <CheckIcon class="bottom-sheet-check" />
        <span class="sr-only">{{ t("chat.assistantSelected") }}</span>
      </span>
    </button>
  </BaseBottomSheet>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";

const {t} = useI18n();

defineProps({
  open: {type: Boolean, default: false},
  assistants: {type: Array, default: () => []},
  selectedAssistantId: {type: String, default: ""},
});

defineEmits(["close", "select"]);
</script>
