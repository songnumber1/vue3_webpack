<template>
  <div class="prompt-action-row">
    <div class="prompt-left-actions">
      <PromptModelSelector
        ref="modelSelectorRef"
        :disabled="disabled"
        :model-readonly="modelReadonly"
        :model-value="modelValue"
        :current-model="currentModel"
        :models="models"
        :model-menu-open="modelMenuOpen"
        :is-mobile-sheet="isMobileSheet"
        :model-select-label="modelSelectLabel"
        :readonly-title="resolvedReadonlyTitle"
        @open-model="$emit('open-model')"
        @select-model="$emit('select-model', $event)"
      />

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
              active: activeToolGroupId === tool.id || tool.active,
              'is-template-tool': Boolean(tool.promptTemplateKey),
            }"
            :aria-haspopup="hasChildren(tool) ? 'menu' : undefined"
            :aria-expanded="
              hasChildren(tool) ? activeToolGroupId === tool.id : undefined
            "
            @click="handleToolClick(tool)"
          >
            <span
              v-if="!tool.promptTemplateKey"
              class="prompt-tool-icon"
              aria-hidden="true"
              >{{ tool.icon }}</span
            >
            <span class="prompt-tool-text">
              <strong>{{ tool.label }}</strong>
            </span>
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

      <PromptAttachButton
        ref="attachButtonRef"
        :disabled="disabled"
        :attach-options="attachOptions"
        :attach-menu-open="attachMenuOpen"
        :is-mobile-sheet="isMobileSheet"
        :attach-label="attachLabel"
        @open-attach="$emit('open-attach')"
        @open-file-picker="$emit('open-file-picker', $event)"
      />
    </div>

    <PromptVoiceButton
      :disabled="disabled"
      :can-submit="canSubmit"
      :has-prompt-text="hasPromptText"
      :is-mic-enabled="isMicEnabled"
      :is-voice-listening="isVoiceListening"
      :is-speech-supported="isSpeechSupported"
      :voice-start-label="voiceStartLabel"
      :voice-stop-label="voiceStopLabel"
      :send-label="sendLabel"
      @start-voice="$emit('start-voice')"
      @stop-voice="$emit('stop-voice')"
    />
  </div>
</template>

<script setup>
import {computed, nextTick, ref, watch} from "vue";
import {autoUpdate, flip, offset, shift, useFloating} from "@floating-ui/vue";
import {useI18n} from "vue-i18n";
import PromptAttachButton from "@/components/prompt/parts/PromptAttachButton.vue";
import PromptModelSelector from "@/components/prompt/parts/PromptModelSelector.vue";
import PromptVoiceButton from "@/components/prompt/parts/PromptVoiceButton.vue";

const {t} = useI18n();

const modelSelectorRef = ref(null);
const toolRoot = ref(null);
const attachButtonRef = ref(null);
const toolMenuRef = ref(null);
const toolPositionReady = ref(false);
const activeToolGroupId = ref("");
const submenuPlacement = ref("right");

const toolReferenceRef = computed(() => toolRoot.value || null);

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

const toolMenuStyle = computed(() => ({
  ...toolFloatingStyles.value,
  visibility: toolPositionReady.value ? "visible" : "hidden",
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
  () => props.isMobileSheet,
  () => {
    closeActiveToolGroup();
  }
);

const modelRoot = computed(
  () => modelSelectorRef.value?.modelRoot?.value || modelSelectorRef.value?.modelRoot || null
);
const attachRoot = computed(
  () => attachButtonRef.value?.attachRoot?.value || attachButtonRef.value?.attachRoot || null
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

.prompt-tool-menu button.is-template-tool {
  min-height: 38px;
  padding: 7px 10px;
  border: 0;
  border-radius: 5px;
}

.prompt-tool-menu button.is-template-tool + button.is-template-tool {
  margin-top: 4px;
}

.prompt-tool-menu button.is-template-tool.active {
  background: color-mix(in srgb, var(--accent) 10%, var(--surface));
  color: var(--text);
  box-shadow: none;
}

.prompt-tool-icon {
  width: 24px !important;
  text-align: center;
}

.prompt-tool-dot {
  display: none;
}

.prompt-tool-text {
  display: flex;
  width: auto !important;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  text-align: left;
}

.prompt-tool-menu button.is-template-tool .prompt-tool-text small {
  display: none;
}

.prompt-tool-text strong,
.prompt-tool-text small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.prompt-tool-text strong {
  font-size: var(--font-size-md);
  font-weight: 900;
  line-height: 1.2;
}

.prompt-tool-text small {
  color: var(--muted);
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1.2;
}

.prompt-tool-menu button.is-template-tool.active .prompt-tool-text small {
  color: var(--muted);
}
</style>
