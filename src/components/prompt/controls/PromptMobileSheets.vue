<template>
  <BaseBottomSheet
    :open="modelOpen"
    :title="resolvedModelTitle"
    @close="$emit('close-model')"
  >
    <button
      v-for="model in models"
      :key="model.id"
      class="bottom-sheet-option"
      :class="{active: model.id === modelValue}"
      type="button"
      @click="$emit('select-model', model.id)"
    >
      <span class="bottom-sheet-option-main">
        <strong>{{ model.label }}</strong>
        <small>{{ model.description }}</small>
      </span>

      <CheckIcon v-if="model.id === modelValue" class="bottom-sheet-check" />
    </button>
  </BaseBottomSheet>

  <BaseBottomSheet
    :open="toolOpen"
    :title="resolvedToolTitle"
    :show-back="Boolean(activeToolGroup)"
    :back-label="t('common.back')"
    @back="closeActiveToolGroup"
    @close="closeToolSheet"
  >
    <template v-if="!activeToolGroup">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="bottom-sheet-option bottom-sheet-option--row"
        :class="{
          'is-active': tool.active,
          'bottom-sheet-option--template': Boolean(tool.promptTemplateKey),
        }"
        type="button"
        @click="handleToolClick(tool)"
      >
        <img
          v-if="tool.iconSrc"
          class="bottom-sheet-tool-icon"
          :src="tool.iconSrc"
          alt=""
          aria-hidden="true"
        />
        <span v-else-if="!tool.promptTemplateKey" aria-hidden="true">
          {{ tool.icon }}
        </span>

        <span class="bottom-sheet-option-main">
          <strong>
            {{ tool.label }}
          </strong>
          <small v-if="tool.description">{{ tool.description }}</small>
        </span>

        <span
          v-if="hasChildren(tool) && tool.activeCount > 0"
          class="bottom-sheet-active-badge"
          aria-hidden="true"
        >
          {{ tool.activeCount }}
        </span>

        <span
          v-if="hasChildren(tool) && isSwitchParent(tool)"
          class="bottom-sheet-parent-switch"
          :class="{'is-active': tool.active}"
          role="switch"
          tabindex="0"
          :aria-pressed="tool.active"
          :aria-label="tool.label"
          @click.stop="handleToolSwitchClick(tool)"
          @keydown.enter.stop.prevent="handleToolSwitchClick(tool)"
          @keydown.space.stop.prevent="handleToolSwitchClick(tool)"
        >
          <span aria-hidden="true"></span>
        </span>

        <span
          v-if="hasChildren(tool)"
          class="bottom-sheet-submenu-arrow"
          aria-hidden="true"
        >
          ›
        </span>
      </button>
    </template>

    <template v-else>
      <button
        v-for="child in activeToolGroup.children"
        :key="child.id"
        class="bottom-sheet-option bottom-sheet-option--row bottom-sheet-option--choice"
        :class="[
          `bottom-sheet-option--${child.controlType || activeToolGroup.childControlType || 'default'}`,
          {'is-active': child.active},
        ]"
        type="button"
        :role="getChildRole(child)"
        :aria-checked="child.active"
        @click="$emit('apply-tool', child)"
      >
        <span
          v-if="isCheckboxChild(child)"
          class="bottom-sheet-checkbox"
          aria-hidden="true"
        >
          <span v-if="child.active">✓</span>
        </span>

        <strong>
          {{ child.label }}
        </strong>
      </button>
    </template>
  </BaseBottomSheet>

  <BaseBottomSheet
    :open="attachOpen"
    :title="resolvedAttachTitle"
    @close="$emit('close-attach')"
  >
    <button
      v-for="option in attachOptions"
      :key="option.id"
      class="bottom-sheet-option bottom-sheet-option--row"
      type="button"
      @click="$emit('open-file-picker', option.id)"
    >
      <span aria-hidden="true">
        {{ option.icon }}
      </span>

      <strong>
        {{ option.label }}
      </strong>
    </button>
  </BaseBottomSheet>
</template>

<script setup>
/**
 * @file components/prompt/controls/PromptMobileSheets.vue
 * @description 프롬프트 입력 UI 컴포넌트입니다. 텍스트, 첨부, 도구/모델 선택 이벤트를 composable action으로 전달합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, watch} from "vue";
import {useI18n} from "vue-i18n";

import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import {usePromptToolMenuActions} from "@/composables/prompt/usePromptToolMenuActions";

const {t} = useI18n();

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({
  modelOpen: {
    type: Boolean,
    default: false,
  },

  toolOpen: {
    type: Boolean,
    default: false,
  },

  attachOpen: {
    type: Boolean,
    default: false,
  },

  models: {
    type: Array,
    default: () => [],
  },

  tools: {
    type: Array,
    default: () => [],
  },

  attachOptions: {
    type: Array,
    default: () => [],
  },

  modelValue: {
    type: String,
    default: "",
  },

  toolTitle: {
    type: String,
    default: "Tools",
  },

  modelTitle: {
    type: String,
    default: "",
  },

  attachTitle: {
    type: String,
    default: "",
  },
});

const emit = defineEmits([
  "close-model",
  "close-tool",
  "close-attach",
  "select-model",
  "apply-tool",
  "open-file-picker",
]);

const resolvedModelTitle = computed(
  () => props.modelTitle || t("chat.modelSelect")
);
const resolvedToolTitle = computed(() => props.toolTitle || t("chat.tools"));
const resolvedAttachTitle = computed(
  () => props.attachTitle || t("chat.attach")
);

const {
  activeToolGroup,
  hasChildren,
  isSwitchParent,
  isCheckboxChild,
  getChildRole,
  handleToolClick,
  handleToolSwitchClick,
  closeActiveToolGroup,
} = usePromptToolMenuActions({
  tools: () => props.tools,
  emit,
});

function closeToolSheet() {
  closeActiveToolGroup();
  emit("close-tool");
}

watch(
  () => props.toolOpen,
  (open) => {
    if (!open) closeActiveToolGroup();
  }
);
</script>
