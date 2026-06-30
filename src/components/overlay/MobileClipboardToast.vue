<template>
  <Transition name="mobile-clipboard-toast">
    <aside
      v-if="visible"
      class="mobile-clipboard-toast tw-fixed tw-left-1/2 tw-bottom-[calc(var(--safe-area-bottom,0px)+24px)] tw-z-[calc(var(--z-toast,3000)+2)] tw-max-w-[min(320px,calc(100vw-32px))] -tw-translate-x-1/2 tw-rounded-full tw-bg-slate-900/90 tw-px-3.5 tw-py-2.5 tw-text-center tw-text-sm tw-font-bold tw-leading-[1.35] tw-text-white tw-shadow-menu tw-pointer-events-none"
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
 */

import {onBeforeUnmount, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {
  APP_CLIPBOARD_COPIED_EVENT,
  APP_TOAST_REQUESTED_EVENT,
} from "@/utils/appFeedback";

const TOAST_DURATION_MS = 2200;

const {t} = useI18n();
const visible = ref(false);
const message = ref("");
let timerId = 0;

function clearTimer() {
  if (!timerId) return;
  window.clearTimeout(timerId);
  timerId = 0;
}

function hideToast() {
  clearTimer();
  visible.value = false;
}

function showToast(event) {
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

<style scoped lang="scss">
/* Layout/visual shell is owned by tw-* utilities in the template.
   Only Vue transition states remain here. */
.mobile-clipboard-toast-enter-active,
.mobile-clipboard-toast-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.mobile-clipboard-toast-enter-from,
.mobile-clipboard-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
