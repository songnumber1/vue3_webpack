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
    @back="activeToolGroupId = ''"
    @close="closeToolSheet"
  >
    <template v-if="!activeToolGroup">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="bottom-sheet-option bottom-sheet-option--row"
        :class="{'is-active': tool.active}"
        type="button"
        @click="handleToolClick(tool)"
      >
        <span aria-hidden="true">
          {{ tool.icon }}
        </span>

        <strong>
          {{ tool.label }}
        </strong>

        <span
          v-if="hasChildren(tool) && isSwitchParent(tool)"
          class="bottom-sheet-parent-switch"
          :class="{'is-active': tool.active}"
          aria-hidden="true"
        >
          <span></span>
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
        @click="applyNestedTool(child)"
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
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";

import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";

const {t} = useI18n();

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

const activeToolGroupId = ref("");

const activeToolGroup = computed(() => {
  return props.tools.find((tool) => tool.id === activeToolGroupId.value) || null;
});

const resolvedModelTitle = computed(() => {
  return props.modelTitle || t("prompt.modelSelect");
});

const resolvedAttachTitle = computed(() => {
  return props.attachTitle || t("prompt.attach");
});

const resolvedToolTitle = computed(() => {
  return activeToolGroup.value?.label || props.toolTitle;
});

function hasChildren(tool) {
  return Array.isArray(tool?.children) && tool.children.length > 0;
}

function isSwitchParent(tool) {
  return tool?.parentControlType === "switch";
}

function isCheckboxChild(tool) {
  return tool?.controlType === "checkbox";
}

function getChildRole(tool) {
  return tool?.selectionMode === "single" ? "menuitemradio" : "menuitemcheckbox";
}

function handleToolClick(tool) {
  if (!hasChildren(tool)) {
    emit("apply-tool", tool);
    return;
  }

  activeToolGroupId.value = tool.id;
}

function applyNestedTool(tool) {
  emit("apply-tool", tool);
}

function closeToolSheet() {
  activeToolGroupId.value = "";
  emit("close-tool");
}

watch(
  () => props.toolOpen,
  (open) => {
    if (!open) activeToolGroupId.value = "";
  }
);
</script>

<style scoped>
.bottom-sheet-option-main {
  min-width: 0;
}

.bottom-sheet-submenu-arrow {
  margin-left: auto;
  color: var(--muted);
  font-size: var(--font-size-lg);
  line-height: 1;
}

.bottom-sheet-parent-switch {
  position: relative;
  width: 38px;
  height: 22px;
  min-width: 38px;
  margin-left: auto;
  border-radius: 999px;
  background: var(--control-border);
  transition: background 0.18s ease;
}

.bottom-sheet-parent-switch span {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18);
  transition: transform 0.18s ease;
}

.bottom-sheet-parent-switch.is-active {
  background: var(--accent);
}

.bottom-sheet-parent-switch.is-active span {
  transform: translateX(16px);
}

.bottom-sheet-parent-switch + .bottom-sheet-submenu-arrow {
  margin-left: 6px;
}

.bottom-sheet-option--choice {
  gap: 12px;
}

.bottom-sheet-option--choice strong {
  flex: 1;
  min-width: 0;
}

.bottom-sheet-option--selectedRow.is-active {
  background: color-mix(in srgb, var(--accent) 10%, var(--control-hover));
  color: var(--text);
}

.bottom-sheet-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  min-width: 18px;
  border: 1px solid var(--control-border);
  border-radius: 5px;
  background: var(--surface);
  color: var(--surface);
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.bottom-sheet-option.is-active .bottom-sheet-checkbox {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--surface);
}

</style>
