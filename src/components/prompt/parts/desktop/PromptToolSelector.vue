<template>
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
</template>

<script setup>
import {computed, nextTick, ref, watch} from "vue";
import {autoUpdate, flip, offset, shift, useFloating} from "@floating-ui/vue";

const toolRoot = ref(null);
const toolMenuRef = ref(null);
const toolPositionReady = ref(false);
const activeToolGroupId = ref("");
const submenuPlacement = ref("right");

const props = defineProps({
  disabled: {type: Boolean, default: false},
  tools: {type: Array, default: () => []},
  toolMenuOpen: {type: Boolean, default: false},
  isMobileSheet: {type: Boolean, default: false},
});

const emit = defineEmits(["open-tool", "apply-tool"]);

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

defineExpose({toolRoot});
</script>
