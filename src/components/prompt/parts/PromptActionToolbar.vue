<template>
  <div class="prompt-action-row">
    <div class="prompt-left-actions">
      <div ref="modelRoot" class="prompt-selector-wrap">
        <button
          class="prompt-model-trigger"
          type="button"
          :disabled="disabled || modelReadonly"
          :title="modelReadonly ? resolvedReadonlyTitle : undefined"
          :aria-label="modelSelectLabel"
          @click="$emit('open-model')"
        >
          <span>{{ currentModel.label }}</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M5.5 7.5 10 12l4.5-4.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <div
          v-if="modelMenuOpen && !isMobileSheet"
          class="prompt-popover model-menu prompt-model-menu"
        >
          <button
            v-for="model in models"
            :key="model.id"
            class="model-option"
            :class="{active: model.id === modelValue}"
            type="button"
            @click="$emit('select-model', model.id)"
          >
            <span class="model-option-main">
              <strong>{{ model.label }}</strong>
              <small>{{ model.description }}</small>
            </span>
            <CheckIcon v-if="model.id === modelValue" class="option-check" />
          </button>
        </div>
      </div>

      <div ref="toolRoot" class="prompt-selector-wrap">
        <button
          class="prompt-icon-action"
          :class="{'prompt-icon-action--active': toolMenuOpen}"
          type="button"
          :disabled="disabled"
          aria-label="Tools"
          @click="$emit('open-tool')"
        >
          ＋
        </button>
        <div
          v-if="toolMenuOpen && !isMobileSheet"
          ref="toolMenuRef"
          class="prompt-popover prompt-tool-menu prompt-floating-menu"
          :style="toolMenuStyle"
        >
          <button
            v-for="tool in tools"
            :key="tool.id"
            type="button"
            :class="{
              'prompt-tool-menu-parent': hasChildren(tool),
              active: activeToolGroupId === tool.id,
            }"
            :aria-haspopup="hasChildren(tool) ? 'menu' : undefined"
            :aria-expanded="
              hasChildren(tool) ? activeToolGroupId === tool.id : undefined
            "
            @click="handleToolClick(tool)"
          >
            <span aria-hidden="true">{{ tool.icon }}</span>
            <p>{{ tool.label }}</p>
            <span
              v-if="hasChildren(tool) && tool.active && !isSwitchParent(tool)"
              class="prompt-menu-active-badge"
              aria-hidden="true"
            >
              {{ tool.activeCount }}
            </span>
            <span
              v-if="hasChildren(tool) && isSwitchParent(tool)"
              class="prompt-tool-parent-switch"
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
              class="prompt-submenu-arrow"
              aria-hidden="true"
            >
              ›
            </span>
          </button>

          <div
            v-if="activeToolGroup"
            class="prompt-popover prompt-tool-submenu"
            :class="`prompt-tool-submenu--${submenuPlacement}`"
            role="menu"
          >
            <button
              v-for="child in activeToolGroup.children"
              :key="child.id"
              class="prompt-tool-child-option"
              :class="[
                `prompt-tool-child-option--${child.controlType || activeToolGroup.childControlType || 'default'}`,
                {'is-active': child.active},
              ]"
              type="button"
              :role="getChildRole(child)"
              :aria-checked="child.active"
              @click="applyNestedTool(child)"
            >
              <span
                v-if="isCheckboxChild(child)"
                class="prompt-tool-checkbox"
                aria-hidden="true"
              >
                <span v-if="child.active">✓</span>
              </span>
              <p>{{ child.label }}</p>
            </button>
          </div>
        </div>
      </div>

      <div ref="attachRoot" class="prompt-selector-wrap attach-menu-wrap">
        <button
          class="prompt-icon-action attach-button"
          :class="{'prompt-icon-action--active': attachMenuOpen}"
          type="button"
          :title="attachLabel"
          :aria-label="attachLabel"
          :disabled="disabled"
          @click="$emit('open-attach')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M21.4 11.6 12.1 20.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4.1 4.1 0 0 1 5.8 5.8l-9.4 9.4a2.2 2.2 0 1 1-3.1-3.1l8.6-8.6"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <div
          v-if="attachMenuOpen && !isMobileSheet"
          ref="attachMenuRef"
          class="prompt-popover attach-menu prompt-floating-menu"
          :style="attachMenuStyle"
          role="menu"
        >
          <button
            v-for="option in attachOptions"
            :key="option.id"
            type="button"
            role="menuitem"
            @click="$emit('open-file-picker', option.id)"
          >
            <span aria-hidden="true">{{ option.icon }}</span>
            <p>{{ option.label }}</p>
          </button>
        </div>
      </div>
    </div>

    <button
      v-if="showVoiceStartButton"
      class="voice-button voice-button--start"
      type="button"
      :disabled="disabled || !isSpeechSupported"
      :title="voiceStartLabel"
      :aria-label="voiceStartLabel"
      @click="$emit('start-voice')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <button
      v-else-if="showVoiceStopButton"
      class="voice-button voice-button--stop"
      type="button"
      :disabled="disabled"
      :title="voiceStopLabel"
      :aria-label="voiceStopLabel"
      @click="$emit('stop-voice')"
    >
      <span aria-hidden="true"></span>
    </button>

    <button
      v-else
      class="send-button"
      type="submit"
      :disabled="disabled || !canSubmit"
      :title="sendLabel"
      :aria-label="sendLabel"
    >
      ↗
    </button>
  </div>
</template>

<script setup>
import {computed, nextTick, ref, watch} from "vue";
import {autoUpdate, flip, offset, shift, useFloating} from "@floating-ui/vue";
import {useI18n} from "vue-i18n";
import CheckIcon from "@/components/icons/CheckIcon.vue";

const {t} = useI18n();

const modelRoot = ref(null);
const toolRoot = ref(null);
const attachRoot = ref(null);
const toolMenuRef = ref(null);
const attachMenuRef = ref(null);
const toolPositionReady = ref(false);
const attachPositionReady = ref(false);
const activeToolGroupId = ref("");
const submenuPlacement = ref("right");

const toolReferenceRef = computed(() => toolRoot.value || null);
const attachReferenceRef = computed(() => attachRoot.value || null);

const {floatingStyles: toolFloatingStyles, update: updateToolFloating} =
  useFloating(toolReferenceRef, toolMenuRef, {
    placement: "top-start",
    strategy: "absolute",
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({fallbackPlacements: ["top-end", "bottom-start", "bottom-end"]}),
      shift({padding: 12}),
    ],
  });

const {floatingStyles: attachFloatingStyles, update: updateAttachFloating} =
  useFloating(attachReferenceRef, attachMenuRef, {
    placement: "top-start",
    strategy: "absolute",
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({fallbackPlacements: ["top-end", "bottom-start", "bottom-end"]}),
      shift({padding: 12}),
    ],
  });

const toolMenuStyle = computed(() => ({
  ...toolFloatingStyles.value,
  visibility: toolPositionReady.value ? "visible" : "hidden",
}));

const attachMenuStyle = computed(() => ({
  ...attachFloatingStyles.value,
  visibility: attachPositionReady.value ? "visible" : "hidden",
}));

const props = defineProps({
  disabled: {type: Boolean, default: false},
  modelReadonly: {type: Boolean, default: false},
  modelValue: {type: String, default: ""},
  currentModel: {type: Object, required: true},
  models: {type: Array, default: () => []},
  tools: {type: Array, default: () => []},
  attachOptions: {type: Array, default: () => []},
  modelMenuOpen: {type: Boolean, default: false},
  toolMenuOpen: {type: Boolean, default: false},
  attachMenuOpen: {type: Boolean, default: false},
  isMobileSheet: {type: Boolean, default: false},
  canSubmit: {type: Boolean, default: false},
  hasPromptText: {type: Boolean, default: false},
  isMicEnabled: {type: Boolean, default: false},
  isVoiceListening: {type: Boolean, default: false},
  hasVoiceStopped: {type: Boolean, default: false},
  isSpeechSupported: {type: Boolean, default: true},
  voiceStartLabel: {type: String, default: "Start voice input"},
  voiceStopLabel: {type: String, default: "Stop voice input"},
  attachLabel: {type: String, default: "Attach"},
  sendLabel: {type: String, default: "Send"},
  modelSelectLabel: {type: String, default: "Select model"},
  readonlyTitle: {type: String, default: ""},
});

const emit = defineEmits([
  "open-model",
  "open-tool",
  "open-attach",
  "select-model",
  "apply-tool",
  "open-file-picker",
  "start-voice",
  "stop-voice",
]);

const resolvedReadonlyTitle = computed(
  () => props.readonlyTitle || t("prompt.modelReadonly")
);

const showVoiceStartButton = computed(
  () =>
    props.isMicEnabled &&
    props.isSpeechSupported &&
    !props.hasPromptText &&
    !props.isVoiceListening
);
const showVoiceStopButton = computed(
  () => props.isMicEnabled && props.isVoiceListening
);

const activeToolGroup = computed(() => {
  return (
    props.tools.find((tool) => tool.id === activeToolGroupId.value) || null
  );
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

function resolveSubmenuPlacement() {
  const menuRect = toolMenuRef.value?.getBoundingClientRect?.();
  if (!menuRect) {
    submenuPlacement.value = "right";
    return;
  }

  const submenuWidth = 248;
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;
  const rightSpace = viewportWidth - menuRect.right;
  const leftSpace = menuRect.left;
  submenuPlacement.value =
    rightSpace >= submenuWidth || rightSpace >= leftSpace ? "right" : "left";
}

async function handleToolClick(tool) {
  if (!hasChildren(tool)) {
    emit("apply-tool", tool);
    return;
  }

  if (activeToolGroupId.value === tool.id) {
    closeActiveToolGroup();
    return;
  }

  closeActiveToolGroup();
  activeToolGroupId.value = tool.id;

  await nextTick();
  await updateToolFloating?.();
  resolveSubmenuPlacement();
}

async function handleToolSwitchClick(tool) {
  if (!isSwitchParent(tool)) return;

  const willEnable = !tool.active;
  emit("apply-tool", tool);

  activeToolGroupId.value = willEnable ? tool.id : "";
  if (!willEnable) return;

  await nextTick();
  await updateToolFloating?.();
  resolveSubmenuPlacement();
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

watch(
  () => props.toolMenuOpen,
  async (open) => {
    toolPositionReady.value = false;
    if (!open) {
      closeActiveToolGroup();
      return;
    }

    await nextTick();
    await updateToolFloating?.();
    toolPositionReady.value = true;
  },
  {flush: "post"}
);

watch(
  () => props.attachMenuOpen,
  async (open) => {
    attachPositionReady.value = false;
    if (!open) return;

    await nextTick();
    await updateAttachFloating?.();
    attachPositionReady.value = true;
  },
  {flush: "post"}
);

watch(
  () => props.isMobileSheet,
  () => {
    closeActiveToolGroup();
  }
);

defineExpose({modelRoot, toolRoot, attachRoot});
</script>

<style scoped>
.prompt-action-row {
  min-width: 0;
}

.prompt-left-actions {
  min-width: 0;
}

.prompt-selector-wrap {
  min-width: 0;
}

.prompt-model-trigger span,
.model-option-main {
  min-width: 0;
}

.prompt-popover {
  box-sizing: border-box;
}

.prompt-tool-menu-parent {
  position: relative;
}

.prompt-tool-menu-parent.active {
  background: var(--control-hover);
}

.prompt-submenu-arrow {
  margin-left: auto;
  width: auto;
  color: var(--muted);
  font-size: var(--font-size-lg);
  line-height: 1;
}

.prompt-tool-submenu {
  top: 0;
  bottom: auto;
  min-width: 220px;
}

.prompt-tool-submenu--right {
  left: calc(100% + 8px);
  right: auto;
}

.prompt-tool-submenu--left {
  right: calc(100% + 8px);
  left: auto;
}

.prompt-floating-menu {
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
  z-index: var(--z-popover);
}

.prompt-menu-active-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  margin-left: auto;
  padding: 0 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  color: var(--accent);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.prompt-menu-active-badge + .prompt-submenu-arrow,
.prompt-tool-parent-switch + .prompt-submenu-arrow {
  margin-left: 6px;
}

.prompt-tool-parent-switch {
  appearance: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  position: relative;
  width: 34px;
  height: 20px;
  min-width: 34px;
  margin-left: auto;
  border-radius: 999px;
  background: var(--control-border);
  transition: background 0.18s ease;
}

.prompt-tool-parent-switch span {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.16);
  transition: transform 0.18s ease;
}

.prompt-tool-parent-switch.is-active {
  background: var(--accent);
}

.prompt-tool-parent-switch.is-active span {
  transform: translateX(14px);
}

.prompt-tool-child-option {
  gap: 12px;
  min-height: 44px;
}

.prompt-tool-child-option p {
  flex: 1;
  min-width: 0;
}

.prompt-tool-child-option--selectedRow.is-active {
  background: color-mix(in srgb, var(--accent) 10%, var(--control-hover));
  color: var(--text);
}

.prompt-tool-checkbox {
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

.prompt-tool-child-option.is-active .prompt-tool-checkbox {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--surface);
}

.prompt-tool-parent-switch > span {
  min-width: 14px;
  flex: 0 0 14px;
  text-align: initial;
  font-size: 0;
}

.prompt-tool-child-option--selectedRow.is-active {
  background: var(--control-hover);
}
</style>
