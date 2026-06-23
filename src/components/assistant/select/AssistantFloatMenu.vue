<template>
  <div
    v-if="open"
    ref="menuRef"
    class="assistant-menu tw-absolute tw-z-popover tw-mt-2 tw-w-full tw-rounded-control tw-border tw-border-app-border tw-bg-app-menu tw-shadow-menu"
  >
    <button
      v-for="assistant in assistants"
      :key="assistant.id"
      class="assistant-option tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-text-left tw-transition"
      :class="{active: assistant.id === selectedAssistantId}"
      type="button"
      @click="$emit('select', assistant.id)"
    >
      <span
        class="assistant-option-main tw-flex tw-min-w-0 tw-flex-col tw-gap-1"
      >
        <strong>{{ assistant.label }}</strong>
        <small>{{ assistant.description }}</small>
      </span>
      <span
        v-if="assistant.id === selectedAssistantId"
        class="option-selected-indicator tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center"
        :aria-label="t('chat.assistantSelected')"
      >
        <CheckIcon class="option-check" />
        <span class="sr-only">{{ t("chat.assistantSelected") }}</span>
      </span>
    </button>
  </div>
</template>

<script setup>
/**
 * @file components/assistant/select/AssistantFloatMenu.vue
 * @description PC 사이드바 Assistant 선택 FloatMenu 전용 컴포넌트입니다.
 */

import {ref} from "vue";
import {useI18n} from "vue-i18n";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";

const props = defineProps({
  assistants: {type: Array, default: () => []},
  selectedAssistantId: {type: String, default: ""},
  open: {type: Boolean, default: false},
});

defineEmits(["select"]);

const {t} = useI18n();
const {shouldUseOverlayScrollbar} = useOverlayScrollPolicy();
const menuRef = ref(null);

useOverlayScrollbar(
  menuRef,
  {overflow: {x: "hidden", y: "scroll"}},
  {
    watchSource: () => [props.open, props.assistants.length],
    enabled: () => shouldUseOverlayScrollbar.value && props.open,
  }
);

defineExpose({menuRef});
</script>
