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
    <div
      v-if="open && !mobile"
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
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import {useI18n} from "vue-i18n";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";

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
const {shouldUseOverlayScrollbar} = useOverlayScrollPolicy();
const rootRef = ref(null);
const menuRef = ref(null);
const currentAssistant = computed(
  () =>
    props.assistants.find((item) => item.id === props.selectedAssistantId) ||
    props.assistants[0] || {label: "Assistant"}
);

useOverlayScrollbar(
  menuRef,
  {overflow: {x: "hidden", y: "scroll"}},
  {
    watchSource: () => [props.open, props.mobile, props.assistants.length],
    enabled: () =>
      shouldUseOverlayScrollbar.value && props.open && !props.mobile,
  }
);

defineExpose({rootRef});
</script>
