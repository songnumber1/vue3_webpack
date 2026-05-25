<template>
  <div v-if="visible" class="virtual-keyboard-debug" aria-live="polite">
    <button
      class="virtual-keyboard-debug__fab"
      type="button"
      :aria-expanded="panelOpen"
      aria-controls="virtual-keyboard-debug-panel"
      @click="togglePanel"
    >
      {{ t("virtualKeyboardDebug.button") }}
    </button>

    <div
      v-if="panelOpen"
      id="virtual-keyboard-debug-panel"
      ref="panelRef"
      class="virtual-keyboard-debug__panel"
      :style="panelStyle"
      role="note"
    >
      <strong>{{ modeTitle }}</strong>
      <p>{{ t("virtualKeyboardDebug.body") }}</p>
      <small>{{ modeDescription }}</small>
    </div>
  </div>
</template>

<script setup>
import {computed, nextTick, onBeforeUnmount, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useEventListener} from "@vueuse/core";
import {KEYBOARD_MODES} from "@/constants/systemSettings";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";

const {t} = useI18n();

const props = defineProps({
  visible: {type: Boolean, default: false},
});

const systemSettingsStore = useSystemSettingsStore();
const {keyboardMode, virtualKeyboardHeight} = storeToRefs(systemSettingsStore);
const panelOpen = ref(false);
const panelRef = ref(null);

const panelHeight = computed(() => {
  const height = Number(virtualKeyboardHeight.value);
  return Number.isFinite(height)
    ? Math.min(Math.max(Math.round(height), 180), 600)
    : 340;
});

const panelStyle = computed(() => ({
  height: `${panelHeight.value}px`,
}));

const modeTitle = computed(() =>
  t(
    `virtualKeyboardDebug.titles.${keyboardMode.value || KEYBOARD_MODES.adjustResize}`
  )
);

const modeDescription = computed(() =>
  t(
    `virtualKeyboardDebug.descriptions.${keyboardMode.value || KEYBOARD_MODES.adjustResize}`
  )
);

function clearVirtualKeyboardVars({refresh = true} = {}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.removeAttribute("data-virtual-keyboard-debug");
  root.style.removeProperty("--virtual-keyboard-debug-height");
  root.style.removeProperty("--virtual-keyboard-pan-offset");
  if (refresh && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("virtual-keyboard-debug:changed"));
  }
}

async function applyVirtualKeyboardMode() {
  if (typeof document === "undefined" || !panelOpen.value || !props.visible) {
    clearVirtualKeyboardVars({refresh: false});
    return;
  }

  await nextTick();

  const height = panelHeight.value;
  const root = document.documentElement;
  const mode = keyboardMode.value || KEYBOARD_MODES.adjustResize;

  root.dataset.virtualKeyboardDebug = "open";
  root.dataset.keyboardMode = mode;
  root.style.setProperty("--virtual-keyboard-debug-height", `${height}px`);

  if (mode === KEYBOARD_MODES.adjustResize) {
    root.style.setProperty("--keyboard-height", `${height}px`);
    root.style.setProperty("--mobile-keyboard-inset", `${height}px`);
    root.style.setProperty("--composer-keyboard-inset", `${height}px`);
    root.style.setProperty("--virtual-keyboard-pan-offset", "0px");
    return;
  }

  root.style.setProperty("--keyboard-height", "0px");
  root.style.setProperty("--mobile-keyboard-inset", "0px");
  root.style.setProperty("--composer-keyboard-inset", "0px");

  if (mode === KEYBOARD_MODES.adjustPan) {
    root.style.setProperty("--virtual-keyboard-pan-offset", `${height}px`);
    return;
  }

  root.style.setProperty("--virtual-keyboard-pan-offset", "0px");
}

function closePanel() {
  if (!panelOpen.value) return;
  panelOpen.value = false;
  clearVirtualKeyboardVars();
}

function togglePanel() {
  panelOpen.value = !panelOpen.value;
}

watch(
  () => props.visible,
  (nextVisible) => {
    if (!nextVisible) closePanel();
  }
);

watch(panelOpen, (nextOpen) => {
  if (nextOpen) {
    applyVirtualKeyboardMode();
    return;
  }
  clearVirtualKeyboardVars();
});

watch([keyboardMode, virtualKeyboardHeight], () => {
  if (panelOpen.value) applyVirtualKeyboardMode();
});

useEventListener(window, "resize", closePanel, {passive: true});
useEventListener(window, "orientationchange", closePanel, {passive: true});
useEventListener(window, "viewportguard:applied", () => {
  if (panelOpen.value) applyVirtualKeyboardMode();
});

onBeforeUnmount(() => {
  clearVirtualKeyboardVars();
});
</script>
