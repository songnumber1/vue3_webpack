<template>
  <Transition name="desktop-clipboard-note">
    <aside
      v-if="visible"
      class="desktop-clipboard-note"
      role="status"
      aria-live="polite"
      @mouseenter="pauseTimer"
      @mouseleave="resumeTimer"
    >
      <strong>{{ title }}</strong>
      <span>{{ message }}</span>
    </aside>
  </Transition>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {usePlatformStore} from "@/stores/platformStore";

const NOTE_DURATION_MS = 5000;
const CLIPBOARD_EVENT_NAME = "app:clipboard-copied";

const {t} = useI18n();
const platformStore = usePlatformStore();
const visible = ref(false);
const message = ref("");
let timerId = 0;
let startedAt = 0;
let remainingMs = NOTE_DURATION_MS;

const title = computed(() => t("clipboardNote.title"));

function isDesktopMode() {
  if (!platformStore.info.isPc || platformStore.info.isNativeApp) return false;
  return !document.body.classList.contains("mobile-mode");
}

function clearTimer() {
  if (!timerId) return;
  window.clearTimeout(timerId);
  timerId = 0;
}

function hideNote() {
  clearTimer();
  visible.value = false;
  remainingMs = NOTE_DURATION_MS;
}

function startTimer(duration = NOTE_DURATION_MS) {
  clearTimer();
  remainingMs = duration;
  startedAt = Date.now();
  timerId = window.setTimeout(hideNote, duration);
}

function pauseTimer() {
  if (!visible.value || !timerId) return;
  remainingMs = Math.max(0, remainingMs - (Date.now() - startedAt));
  clearTimer();
}

function resumeTimer() {
  if (!visible.value) return;
  startTimer(remainingMs || NOTE_DURATION_MS);
}

function showNote(event) {
  if (!isDesktopMode()) return;
  message.value = event.detail?.message || t("clipboardNote.message");
  visible.value = true;
  startTimer(NOTE_DURATION_MS);
}

onMounted(() => {
  window.addEventListener(CLIPBOARD_EVENT_NAME, showNote);
});

onBeforeUnmount(() => {
  clearTimer();
  window.removeEventListener(CLIPBOARD_EVENT_NAME, showNote);
});
</script>

<style scoped>
.desktop-clipboard-note {
  position: fixed;
  top: calc(var(--desktop-header-height, 64px) + 20px);
  right: 24px;
  z-index: calc(var(--z-toast, 3000) + 1);
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: min(320px, calc(100vw - 48px));
  padding: 12px 14px;
  border: 1px solid var(--control-border);
  border-radius: 5px;
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  pointer-events: auto;
}

.desktop-clipboard-note strong {
  font-size: var(--font-size-sm);
  font-weight: 800;
  line-height: 1.25;
}

.desktop-clipboard-note span {
  color: var(--muted);
  font-size: var(--font-size-xs);
  line-height: 1.35;
}

.desktop-clipboard-note-enter-active,
.desktop-clipboard-note-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.desktop-clipboard-note-enter-from,
.desktop-clipboard-note-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

:global(body.mobile-mode) .desktop-clipboard-note {
  display: none;
}
</style>
