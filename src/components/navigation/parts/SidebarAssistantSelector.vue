<template>
  <div ref="rootRef" class="assistant-selector">
    <button
      class="assistant-trigger"
      type="button"
      :aria-label="t('chat.assistantSelect')"
      @click="$emit('toggle')"
    >
      <span>{{ currentAssistant.label }}</span>
      <ChevronDownIcon class="chevron chevron--selector" />
    </button>
    <div v-if="open && !mobile" class="assistant-menu">
      <button
        v-for="assistant in assistants"
        :key="assistant.id"
        class="assistant-option"
        :class="{active: assistant.id === selectedAssistantId}"
        type="button"
        @click="$emit('select', assistant.id)"
      >
        <span class="assistant-option-main">
          <strong>{{ assistant.label }}</strong>
          <small>{{ assistant.description }}</small>
        </span>
        <span
          v-if="assistant.id === selectedAssistantId"
          class="option-selected-indicator"
          aria-label="현재 선택된 값"
        >
          <CheckIcon class="option-check" />
          <span class="sr-only">현재 선택된 값</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const props = defineProps({
  assistants: {type: Array, default: () => []},
  selectedAssistantId: {type: String, default: ""},
  open: {type: Boolean, default: false},
  mobile: {type: Boolean, default: false},
});

defineEmits(["toggle", "select"]);

const {t} = useI18n();
const rootRef = ref(null);
const currentAssistant = computed(
  () =>
    props.assistants.find((item) => item.id === props.selectedAssistantId) ||
    props.assistants[0] || {label: "Assistant"}
);

defineExpose({rootRef});
</script>
