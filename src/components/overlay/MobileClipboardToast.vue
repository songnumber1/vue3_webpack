<template>
  <Transition name="mobile-clipboard-toast">
    <aside
      v-if="visible"
      class="mobile-clipboard-toast pointer-events-none fixed bottom-[calc(var(--safe-area-bottom,0px)+24px)] left-1/2 z-[calc(var(--z-toast,3000)+2)] max-w-[min(320px,calc(100vw-32px))] -translate-x-1/2 rounded-full bg-slate-900/90 px-3.5 py-2.5 text-center text-[var(--font-size-sm)] font-bold leading-[1.35] text-white shadow-[0_12px_28px_rgba(15,23,42,.22)]"
      role="status"
      aria-live="polite"
    >
      {{ message }}
    </aside>
  </Transition>
</template>

<script setup>
/**
 * @file components/overlay/MobileClipboardToast.vue
 * @description 재사용 UI 컴포넌트입니다. 화면 상태는 상위 props/action에서 받고 내부에서는 렌더와 사용자 이벤트만 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {onBeforeUnmount, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {usePlatformStore} from "@/stores/platformStore";
import {
  APP_CLIPBOARD_COPIED_EVENT,
  APP_TOAST_REQUESTED_EVENT,
  shouldUseMobileFeedbackChannel,
} from "@/utils/appFeedback";

const TOAST_DURATION_MS = 2200;

const {t} = useI18n();
const platformStore = usePlatformStore();
const visible = ref(false);
const message = ref("");
let timerId = 0;

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
function shouldShowMobileToast() {
  return shouldUseMobileFeedbackChannel(platformStore.info || {});
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function hideToast() {
  clearTimer();
  visible.value = false;
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function showToast(event) {
  if (!shouldShowMobileToast()) return;
  message.value =
    event.detail?.toastMessage ||
    event.detail?.message ||
    t("clipboardNote.toastMessage");
  visible.value = true;
  clearTimer();
  timerId = window.setTimeout(hideToast, TOAST_DURATION_MS);
}

onMounted(() => {
  window.addEventListener(APP_CLIPBOARD_COPIED_EVENT, showToast);
  window.addEventListener(APP_TOAST_REQUESTED_EVENT, showToast);
});

onBeforeUnmount(() => {
  clearTimer();
  window.removeEventListener(APP_CLIPBOARD_COPIED_EVENT, showToast);
  window.removeEventListener(APP_TOAST_REQUESTED_EVENT, showToast);
});
</script>
