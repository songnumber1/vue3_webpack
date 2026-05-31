<template>
  <Transition name="desktop-clipboard-note">
    <aside
      v-if="visible"
      class="desktop-clipboard-note tw-fixed tw-right-6 tw-top-[calc(var(--desktop-header-height,64px)+20px)] tw-z-[calc(var(--z-toast,3000)+1)] tw-flex tw-w-[min(320px,calc(100vw-48px))] tw-flex-col tw-gap-1 tw-rounded-dialog tw-border tw-border-app-controlBorder tw-bg-app-surface tw-px-3.5 tw-py-3 tw-text-app-text tw-shadow-menu"
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
/**
 * @file components/overlay/DesktopClipboardNote.vue
 * @description 재사용 UI 컴포넌트입니다. 화면 상태는 상위 props/action에서 받고 내부에서는 렌더와 사용자 이벤트만 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {usePlatformStore} from "@/stores/platformStore";
import {
  APP_CLIPBOARD_COPIED_EVENT,
  APP_TOAST_REQUESTED_EVENT,
  shouldUseMobileFeedbackChannel,
} from "@/utils/appFeedback";

const NOTE_DURATION_MS = 5000;

const {t} = useI18n();
const platformStore = usePlatformStore();
const visible = ref(false);
const message = ref("");
const noteTitle = ref("");
let timerId = 0;
let startedAt = 0;
let remainingMs = NOTE_DURATION_MS;

const title = computed(() => noteTitle.value || t("clipboardNote.title"));

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function shouldShowWebClipboardNote() {
  return !shouldUseMobileFeedbackChannel(platformStore.info || {});
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function clearTimer() {
  if (!timerId) return;
  window.clearTimeout(timerId);
  timerId = 0;
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function hideNote() {
  clearTimer();
  visible.value = false;
  remainingMs = NOTE_DURATION_MS;
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function startTimer(duration = NOTE_DURATION_MS) {
  clearTimer();
  remainingMs = duration;
  startedAt = Date.now();
  timerId = window.setTimeout(hideNote, duration);
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function pauseTimer() {
  if (!visible.value || !timerId) return;
  remainingMs = Math.max(0, remainingMs - (Date.now() - startedAt));
  clearTimer();
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function resumeTimer() {
  if (!visible.value) return;
  startTimer(remainingMs || NOTE_DURATION_MS);
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function showNote(event) {
  if (!shouldShowWebClipboardNote()) return;
  noteTitle.value =
    event.type === APP_TOAST_REQUESTED_EVENT
      ? event.detail?.title || t("toastNote.title")
      : t("clipboardNote.title");
  message.value = event.detail?.message || t("clipboardNote.message");
  visible.value = true;
  startTimer(NOTE_DURATION_MS);
}

onMounted(() => {
  window.addEventListener(APP_CLIPBOARD_COPIED_EVENT, showNote);
  window.addEventListener(APP_TOAST_REQUESTED_EVENT, showNote);
});

onBeforeUnmount(() => {
  clearTimer();
  window.removeEventListener(APP_CLIPBOARD_COPIED_EVENT, showNote);
  window.removeEventListener(APP_TOAST_REQUESTED_EVENT, showNote);
});
</script>

<style scoped lang="scss">
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
  top: calc(var(--mobile-header-height, 56px) + 12px);
  right: 12px;
  width: min(320px, calc(100vw - 24px));
}
</style>
