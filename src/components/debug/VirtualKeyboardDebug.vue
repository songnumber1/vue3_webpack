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

<style scoped>
:global(.virtual-keyboard-debug) {
  display: none;
}

:global(body.mobile-mode .virtual-keyboard-debug) {
  display: block;
}

:global(.virtual-keyboard-debug__fab) {
  position: fixed;
  right: max(16px, env(safe-area-inset-right, 0px) + 16px);
  bottom: calc(env(safe-area-inset-bottom, 0px) + 84px);
  z-index: 2147483000;
  min-width: 72px;
  height: 40px;
  border: 1px solid var(--color-border, rgba(148, 163, 184, 0.35));
  border-radius: 999px;
  background: var(--color-surface, #ffffff);
  color: var(--color-text, #111827);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

:global(.virtual-keyboard-debug__panel) {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2147482999;
  min-height: 0;
  box-sizing: border-box;
  padding: 28px 24px calc(28px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--color-border, rgba(148, 163, 184, 0.35));
  background:
    repeating-linear-gradient(
      0deg,
      rgba(148, 163, 184, 0.08),
      rgba(148, 163, 184, 0.08) 1px,
      transparent 1px,
      transparent 28px
    ),
    var(--color-surface, #ffffff);
  color: var(--color-text, #111827);
  box-shadow: 0 -16px 36px rgba(15, 23, 42, 0.18);
  text-align: center;
}

:global(.virtual-keyboard-debug__panel strong) {
  display: block;
  margin: 0 0 8px;
  font-size: var(--font-size-base);
}

:global(.virtual-keyboard-debug__panel p) {
  max-width: 320px;
  margin: 0 auto;
  color: var(--color-text-muted, #64748b);
  font-size: var(--font-size-sm);
  line-height: 1.55;
}

:global(.virtual-keyboard-debug__panel small) {
  display: block;
  max-width: 360px;
  margin: 10px auto 0;
  color: var(--color-text-muted, #64748b);
  font-size: var(--font-size-xs);
  line-height: 1.45;
}

:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustResize"] body.mobile-mode .virtual-keyboard-debug__fab) {
  bottom: calc(var(--virtual-keyboard-debug-height, 0px) + env(safe-area-inset-bottom, 0px) + 16px);
}

:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustPan"] body.mobile-mode .chat-workspace > :not(.virtual-keyboard-debug)) {
  transform: translate3d(0, calc(var(--virtual-keyboard-pan-offset, 0px) * -1), 0);
  transition: transform 180ms ease;
}

:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustPan"] body.mobile-mode .virtual-keyboard-debug__fab),
:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustNothing"] body.mobile-mode .virtual-keyboard-debug__fab) {
  bottom: calc(env(safe-area-inset-bottom, 0px) + 84px);
}

:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustResize"] body.mobile-mode .chat-container-root--mode-chat),
:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustResize"] body.mobile-mode .chat-container-root--mode-shared) {
  height: calc(var(--app-height, 100dvh) - var(--virtual-keyboard-debug-height, 0px)) !important;
  max-height: calc(var(--app-height, 100dvh) - var(--virtual-keyboard-debug-height, 0px)) !important;
  min-height: 0 !important;
  overflow: hidden !important;
}

:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustResize"] body.mobile-mode .chat-container-root--mode-chat .chat-workspace),
:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustResize"] body.mobile-mode .chat-container-root--mode-shared .chat-workspace) {
  height: calc(var(--app-height, 100dvh) - var(--virtual-keyboard-debug-height, 0px)) !important;
  max-height: calc(var(--app-height, 100dvh) - var(--virtual-keyboard-debug-height, 0px)) !important;
  min-height: 0 !important;
  overflow: hidden !important;
}

:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustResize"] body.mobile-mode .chat-container-root--mode-chat .message-list),
:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustResize"] body.mobile-mode .chat-container-root--mode-shared .message-list) {
  min-height: 0 !important;
  overflow-y: auto !important;
  padding-bottom: max(16px, env(safe-area-inset-bottom, 0px)) !important;
}

:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustResize"] body.mobile-mode .chat-container-root--mode-chat .chat-composer-slot),
:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustResize"] body.mobile-mode .chat-container-root--mode-shared .chat-composer-slot) {
  position: relative !important;
  z-index: var(--z-content-raised, 20) !important;
}

:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustPan"] body.mobile-mode .chat-container-root--mode-main .mobile-main-fixed-prompt),
:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustPan"] body.mobile-mode .chat-container-root--mode-main .mobile-main-fixed-prompt.prompt-wrap) {
  bottom: calc(var(--virtual-keyboard-debug-height, 0px) + env(safe-area-inset-bottom, 0px) + 8px) !important;
}

:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustPan"] body.mobile-mode .chat-container-root--mode-chat .chat-composer-slot),
:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustPan"] body.mobile-mode .chat-container-root--mode-shared .chat-composer-slot) {
  z-index: var(--z-prompt-floating, 90) !important;
}

:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustPan"] body.mobile-mode .chat-container-root--mode-main .mobile-main-fixed-prompt),
:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustPan"] body.mobile-mode .chat-container-root--mode-main .mobile-main-fixed-prompt.prompt-wrap) {
  position: fixed !important;
  top: auto !important;
  right: 0 !important;
  bottom: calc(var(--virtual-keyboard-debug-height, 0px) + env(safe-area-inset-bottom, 0px) + 8px) !important;
  left: 0 !important;
  z-index: var(--z-prompt-floating, 90) !important;
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
  transform: translate3d(0, var(--virtual-keyboard-pan-offset, 0px), 0) !important;
  will-change: transform, bottom;
}

:global(html[data-virtual-keyboard-debug="open"][data-keyboard-mode="adjustPan"] body.mobile-mode .chat-container-root--mode-main .mobile-main-fixed-prompt .prompt-box) {
  width: min(100%, var(--layout-prompt-width, 820px)) !important;
  max-width: min(100%, var(--layout-prompt-width, 820px)) !important;
  margin: 0 auto !important;
}
</style>
