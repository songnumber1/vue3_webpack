<template>
  <div v-if="visible" class="virtual-keyboard-debug" aria-live="polite">
    <button
      class="virtual-keyboard-debug__fab"
      type="button"
      :aria-expanded="panelOpen"
      aria-controls="virtual-keyboard-debug-panel"
      @click="togglePanel"
    >
      키보드
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
      <p>
        실제 키는 제공하지 않습니다. Android Chrome 기준 확인용이며 실제 기기와
        높이/동작이 다를 수 있습니다.
      </p>
      <small>{{ modeDescription }}</small>
    </div>
  </div>
</template>

<script setup>
import {computed, nextTick, onBeforeUnmount, ref, watch} from "vue";
import {storeToRefs} from "pinia";
import {useEventListener} from "@vueuse/core";
import {KEYBOARD_MODES} from "@/constants/systemSettings";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";

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

const modeTitle = computed(() => {
  if (keyboardMode.value === KEYBOARD_MODES.adjustNothing) {
    return "가상 키보드 테스트 영역 · adjustNothing";
  }
  if (keyboardMode.value === KEYBOARD_MODES.adjustPan) {
    return "가상 키보드 테스트 영역 · adjustPan";
  }
  return "가상 키보드 테스트 영역 · adjustResize";
});

const modeDescription = computed(() => {
  if (keyboardMode.value === KEYBOARD_MODES.adjustNothing) {
    return "현재 모드는 화면 보정 없이 가상 키보드 영역만 덮어서 보여줍니다.";
  }
  if (keyboardMode.value === KEYBOARD_MODES.adjustPan) {
    return "현재 모드는 CSS resize 없이 화면 내용을 위로 밀어 올리는 pan 동작을 흉내냅니다.";
  }
  return "현재 모드는 CSS 키보드 높이 변수를 적용해 입력 영역과 컨텐츠 하단 여백을 조정합니다.";
});

function getPanelHeight() {
  return panelHeight.value;
}

function setRootProperty(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function clearRootProperty(name) {
  document.documentElement.style.removeProperty(name);
}

function dispatchViewportRefresh() {
  window.dispatchEvent(new CustomEvent("virtual-keyboard-debug:changed"));
}

function clearVirtualKeyboardVars({refresh = true} = {}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.removeAttribute("data-virtual-keyboard-debug");
  clearRootProperty("--virtual-keyboard-debug-height");
  clearRootProperty("--virtual-keyboard-pan-offset");
  if (refresh && typeof window !== "undefined") dispatchViewportRefresh();
}

async function applyVirtualKeyboardMode() {
  if (typeof document === "undefined" || !panelOpen.value || !props.visible) {
    clearVirtualKeyboardVars({refresh: false});
    return;
  }

  await nextTick();

  const height = getPanelHeight();
  const root = document.documentElement;
  const mode = keyboardMode.value || KEYBOARD_MODES.adjustResize;

  root.dataset.virtualKeyboardDebug = "open";
  root.dataset.keyboardMode = mode;
  setRootProperty("--virtual-keyboard-debug-height", `${height}px`);

  if (mode === KEYBOARD_MODES.adjustResize) {
    setRootProperty("--keyboard-height", `${height}px`);
    setRootProperty("--mobile-keyboard-inset", `${height}px`);
    setRootProperty("--composer-keyboard-inset", `${height}px`);
    setRootProperty("--virtual-keyboard-pan-offset", "0px");
    return;
  }

  setRootProperty("--keyboard-height", "0px");
  setRootProperty("--mobile-keyboard-inset", "0px");
  setRootProperty("--composer-keyboard-inset", "0px");

  if (mode === KEYBOARD_MODES.adjustPan) {
    setRootProperty("--virtual-keyboard-pan-offset", `${height}px`);
    return;
  }

  setRootProperty("--virtual-keyboard-pan-offset", "0px");
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
