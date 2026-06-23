<template>
  <div
    ref="rootRef"
    class="assistant-selector tw-relative tw-min-w-0 tw-flex-1"
  >
    <button
      class="assistant-trigger tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-2 tw-rounded-control tw-border tw-border-app-sidebarBorder tw-bg-app-control tw-text-left tw-transition"
      type="button"
      :aria-label="t('chat.assistantSelect')"
      @click="$emit('toggle')"
    >
      <span>{{ currentAssistant.label }}</span>
      <ChevronDownIcon class="chevron chevron--selector" />
    </button>
    <AssistantFloatMenu
      :open="open && !mobile"
      :assistants="assistants"
      :selected-assistant-id="selectedAssistantId"
      @select="$emit('select', $event)"
    />
  </div>
</template>

<script setup>
/**
 * @file components/navigation/controls/SidebarAssistantSelector.vue
 * @description 좌측 메뉴/드로어 관련 UI입니다. navigation store 상태와 사용자 메뉴 action을 화면에 연결합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import AssistantFloatMenu from "@/components/assistant/select/AssistantFloatMenu.vue";

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
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
