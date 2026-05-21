<template>
  <Transition name="mobile-clipboard-toast">
    <aside
      v-if="visible"
      class="mobile-clipboard-toast"
      role="status"
      aria-live="polite"
    >
      {{ message }}
    </aside>
  </Transition>
</template>

<script setup>
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

function clearTimer() {
  if (!timerId) return;
  window.clearTimeout(timerId);
  timerId = 0;
}

function shouldShowMobileToast() {
  return shouldUseMobileFeedbackChannel(platformStore.info || {});
}

function hideToast() {
  clearTimer();
  visible.value = false;
}

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

<style scoped>
.mobile-clipboard-toast {
  position: fixed;
  left: 50%;
  bottom: calc(var(--safe-area-bottom, 0px) + 24px);
  z-index: calc(var(--z-toast, 3000) + 2);
  max-width: min(320px, calc(100vw - 32px));
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: 1.35;
  text-align: center;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.22);
  transform: translateX(-50%);
  pointer-events: none;
}

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
