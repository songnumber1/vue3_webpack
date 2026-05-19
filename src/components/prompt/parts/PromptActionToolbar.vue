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
          class="prompt-popover prompt-tool-menu"
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
            :aria-expanded="hasChildren(tool) ? activeToolGroupId === tool.id : undefined"
            @click="handleToolClick(tool)"
          >
            <span aria-hidden="true">{{ tool.icon }}</span>
            <p>{{ tool.label }}</p>
            <span v-if="hasChildren(tool)" class="prompt-submenu-arrow" aria-hidden="true">
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
              type="button"
              role="menuitem"
              @click="applyNestedTool(child)"
            >
              <span aria-hidden="true">{{ child.icon }}</span>
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
          class="prompt-popover attach-menu"
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
import {useI18n} from "vue-i18n";
import CheckIcon from "@/components/icons/CheckIcon.vue";

const {t} = useI18n();

const modelRoot = ref(null);
const toolRoot = ref(null);
const attachRoot = ref(null);
const toolMenuRef = ref(null);
const activeToolGroupId = ref("");
const submenuPlacement = ref("right");

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
  return props.tools.find((tool) => tool.id === activeToolGroupId.value) || null;
});

function hasChildren(tool) {
  return Array.isArray(tool?.children) && tool.children.length > 0;
}

function resolveSubmenuPlacement() {
  const menuRect = toolMenuRef.value?.getBoundingClientRect?.();
  if (!menuRect) {
    submenuPlacement.value = "right";
    return;
  }

  const submenuWidth = 248;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const rightSpace = viewportWidth - menuRect.right;
  const leftSpace = menuRect.left;
  submenuPlacement.value = rightSpace >= submenuWidth || rightSpace >= leftSpace ? "right" : "left";
}

async function handleToolClick(tool) {
  if (!hasChildren(tool)) {
    emit("apply-tool", tool);
    return;
  }

  activeToolGroupId.value = activeToolGroupId.value === tool.id ? "" : tool.id;
  await nextTick();
  resolveSubmenuPlacement();
}

function applyNestedTool(tool) {
  emit("apply-tool", tool);
  activeToolGroupId.value = "";
}

watch(
  () => props.toolMenuOpen,
  (open) => {
    if (!open) activeToolGroupId.value = "";
  }
);

watch(
  () => props.isMobileSheet,
  () => {
    activeToolGroupId.value = "";
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
  width: auto !important;
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
</style>
