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
        :class="{'is-active': tool.active, 'bottom-sheet-option--template': Boolean(tool.promptTemplateKey)}"
        type="button"
        @click="handleToolClick(tool)"
      >
        <span v-if="!tool.promptTemplateKey" aria-hidden="true">
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
  return (
    props.tools.find((tool) => tool.id === activeToolGroupId.value) || null
  );
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
  return tool?.selectionMode === "single"
    ? "menuitemradio"
    : "menuitemcheckbox";
}

function handleToolClick(tool) {
  if (!hasChildren(tool)) {
    emit("apply-tool", tool);
    return;
  }

  activeToolGroupId.value = tool.id;
}

function handleToolSwitchClick(tool) {
  if (!isSwitchParent(tool)) return;
  const willEnable = !tool.active;
  emit("apply-tool", tool);
  activeToolGroupId.value = willEnable ? tool.id : "";
}

function closeActiveToolGroup() {
  const group = activeToolGroup.value;
  if (isSwitchParent(group) && group.active && group.activeCount === 0) {
    emit("apply-tool", group);
  }
  activeToolGroupId.value = "";
}

function applyNestedTool(tool) {
  emit("apply-tool", tool);
}

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

.bottom-sheet-active-badge {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  width: auto !important;
  min-width: 28px !important;
  height: 28px;
  margin-left: auto;
  padding: 0 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
  font-size: 14px !important;
  font-weight: 800;
  line-height: 1;
}

.bottom-sheet-active-badge + .bottom-sheet-parent-switch,
.bottom-sheet-active-badge + .bottom-sheet-submenu-arrow {
  margin-left: 8px;
}

.bottom-sheet-parent-switch {
  appearance: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  position: relative;
  width: 38px !important;
  height: 22px;
  min-width: 38px !important;
  flex: 0 0 38px !important;
  margin-left: auto;
  border-radius: 999px;
  background: var(--control-border);
  transition: background 0.18s ease;
}

.bottom-sheet-parent-switch span {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px !important;
  height: 16px;
  min-width: 16px !important;
  flex: 0 0 16px !important;
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

/* Prompt tool bottom sheet controls must not inherit generic row icon span sizing. */
.bottom-sheet-option--row > .bottom-sheet-active-badge,
.bottom-sheet-option--row > .bottom-sheet-parent-switch,
.bottom-sheet-option--row > .bottom-sheet-submenu-arrow,
.bottom-sheet-option--row > .bottom-sheet-checkbox {
  box-sizing: border-box;
}

.bottom-sheet-option--row > .bottom-sheet-parent-switch {
  width: 38px !important;
  min-width: 38px !important;
  height: 22px !important;
  flex: 0 0 38px !important;
}

.bottom-sheet-option--row > .bottom-sheet-parent-switch > span {
  width: 16px !important;
  min-width: 16px !important;
  height: 16px !important;
  flex: 0 0 16px !important;
  text-align: initial !important;
  font-size: 0 !important;
}

.bottom-sheet-option--row > .bottom-sheet-checkbox {
  width: 22px !important;
  min-width: 22px !important;
  height: 22px !important;
  flex: 0 0 22px !important;
  text-align: center !important;
  font-size: var(--text-size-body) !important;
}

.bottom-sheet-option--row > .bottom-sheet-checkbox > span {
  width: auto !important;
  min-width: 0 !important;
  height: auto !important;
  flex: 0 0 auto !important;
  text-align: center !important;
  font-size: var(--text-size-body) !important;
  line-height: 1 !important;
}

.bottom-sheet-option--template {
  min-height: 54px;
  display: flex !important;
  justify-content: flex-start !important;
  align-items: center !important;
  gap: 10px !important;
  text-align: left !important;
  border: 0;
}

.bottom-sheet-option--template.is-active {
  background: color-mix(in srgb, var(--accent) 12%, var(--control-hover));
}

.bottom-sheet-template-dot {
  display: none;
}

.bottom-sheet-option--template > .bottom-sheet-option-main {
  display: flex !important;
  width: auto !important;
  min-width: 0 !important;
  flex: 1 1 auto !important;
  flex-direction: column !important;
  align-items: flex-start !important;
  justify-content: center !important;
  gap: 3px !important;
  text-align: left !important;
}

.bottom-sheet-option--template > .bottom-sheet-option-main strong,
.bottom-sheet-option--template > .bottom-sheet-option-main small {
  width: 100% !important;
  text-align: left !important;
}

.bottom-sheet-option--template .bottom-sheet-option-main small {
  color: var(--muted);
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1.2;
}


/* keep template menu rows readable even when mobile global span patches are active */
:global(body.mobile-mode) .bottom-sheet-option--template > .bottom-sheet-option-main {
  width: auto !important;
  min-width: 0 !important;
  flex: 1 1 auto !important;
  text-align: left !important;
}
</style>
