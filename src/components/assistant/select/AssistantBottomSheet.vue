<template>
  <BaseBottomSheet
    :open="open"
    :title="t('chat.assistantSelect')"
    @close="$emit('close')"
  >
    <button
      v-for="assistant in assistants"
      :key="assistant.id"
      class="bottom-sheet-option tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-text-left"
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
        <span
          class="bottom-sheet-option-main assistant-sheet-option-main tw-flex tw-min-w-0 tw-flex-col tw-gap-1"
        >
          <strong>{{ assistant.label }}</strong>
          <small>{{ assistant.description }}</small>
        </span>
      </span>
      <span
        v-if="assistant.id === selectedAssistantId"
        class="bottom-sheet-selected-indicator tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center"
        :aria-label="t('chat.assistantSelected')"
      >
        <CheckIcon class="bottom-sheet-check" />
        <span class="sr-only">{{ t("chat.assistantSelected") }}</span>
      </span>
    </button>
  </BaseBottomSheet>
</template>

<script setup>
/**
 * @file components/assistant/select/AssistantBottomSheet.vue
 * @description 모바일 사이드바 Assistant 선택 BottomSheet 전용 컴포넌트입니다.
 */

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

<style scoped lang="scss">
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
  border-radius: var(--dialog-radius);
  object-fit: cover;
}

.assistant-sheet-option-main,
.bottom-sheet-option-main {
  min-width: 0;
}
</style>
