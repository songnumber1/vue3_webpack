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
      <span class="assistant-sheet-option-content">
        <img
          class="assistant-sheet-option-image"
          :src="getAssistantImageBySize(assistant, 20)"
          alt=""
          aria-hidden="true"
        />
        <span class="bottom-sheet-option-main assistant-sheet-option-main">
          <strong>{{ assistant.label }}</strong>
          <small>{{ assistant.description }}</small>
        </span>
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
import {getAssistantImageBySize} from "@/constants/assistantImages";

const {t} = useI18n();

defineProps({
  open: {type: Boolean, default: false},
  assistants: {type: Array, default: () => []},
  selectedAssistantId: {type: String, default: ""},
});

defineEmits(["close", "select"]);
</script>


<style scoped>
.assistant-sheet-option-content {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1 1 auto;
}

.assistant-sheet-option-image {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  display: block;
  border-radius: 6px;
  object-fit: cover;
}

.assistant-sheet-option-main {
  min-width: 0;
}
</style>
