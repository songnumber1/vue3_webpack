<template>
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
</template>

<script setup>
import {computed, nextTick, ref, watch} from "vue";
import {autoUpdate, flip, offset, shift, useFloating} from "@floating-ui/vue";

const props = defineProps({
  disabled: {type: Boolean, default: false},
  attachOptions: {type: Array, default: () => []},
  attachMenuOpen: {type: Boolean, default: false},
  isMobileSheet: {type: Boolean, default: false},
  attachLabel: {type: String, default: "Attach"},
});

defineEmits(["open-attach", "open-file-picker"]);

const attachRoot = ref(null);
const attachMenuRef = ref(null);
const attachPositionReady = ref(false);
const attachReferenceRef = computed(() => attachRoot.value || null);

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

const attachMenuStyle = computed(() => ({
  ...attachFloatingStyles.value,
  visibility: attachPositionReady.value ? "visible" : "hidden",
}));

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

defineExpose({attachRoot});
</script>

<style scoped>
.prompt-selector-wrap {
  min-width: 0;
}

.prompt-popover {
  box-sizing: border-box;
}

.prompt-floating-menu {
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
  z-index: var(--z-popover);
}
</style>
