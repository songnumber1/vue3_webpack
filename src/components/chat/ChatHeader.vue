<template>
  <header class="mobile-topbar">
    <div class="topbar-left">
      <button
        class="round-icon menu-toggle"
        type="button"
        :aria-label="t('chat.openSidebar')"
        @click="openDrawer"
      >
        <span class="icon-lines"></span>
      </button>

      <button
        class="model-trigger model-trigger--assistant"
        type="button"
        :aria-label="t('chat.assistantSelect')"
        @click="openAssistant"
      >
        <img
          class="assistant-brand-logo assistant-brand-logo--mobile"
          :src="mobileAssistantIcon"
          alt=""
          aria-hidden="true"
        />
        <span>{{ assistantLabel }}</span>
        <ChevronDownIcon class="chevron chevron--selector" />
      </button>

      <button
        v-if="showStudioDetailButton"
        class="round-icon studio-detail-header-button"
        type="button"
        :disabled="studioDetailDisabled"
        aria-label="Studio 상세 보기"
        title="Studio 상세 보기"
        @click.stop="openStudioDetail"
      >
        ⓘ
      </button>
    </div>

    <div class="topbar-actions topbar-actions--mobile">
      <button
        class="round-icon mobile-header-future-action"
        type="button"
        :aria-label="t('common.settings')"
        :title="t('common.settings')"
        @click="openSettings"
      >
        <span aria-hidden="true">⋯</span>
      </button>
    </div>
  </header>
</template>

<script setup>
/**
 * @file components/chat/ChatHeader.vue
 * @description 모바일 전용 채팅 header입니다.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import {getAssistantImageBySize} from "@/constants/assistantImages";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useViewportStore} from "@/stores/viewportStore";
import {useAppShellStore} from "@/stores/appShellStore";
import {openSettingsOverlay} from "@/composables/overlay/responseOverlayActions";
import {useChatWorkspaceActions} from "@/composables/chat/context/chatWorkspaceActionContext";

const props = defineProps({
  mode: {type: String, default: "main"},
  assistantLabel: {type: String, default: "Assistant"},
  assistant: {type: Object, default: null},
  conversationTitle: {type: String, default: ""},
  themeName: {type: String, default: "dark"},
  showStudioDetailButton: {type: Boolean, default: false},
  studioDetailDisabled: {type: Boolean, default: false},
});

const {t} = useI18n();
const chatStreamStore = useChatStreamStore();
const viewportStore = useViewportStore();
const appShellStore = useAppShellStore();
const chatWorkspaceActions = useChatWorkspaceActions();
const isAppShellActionBlocked = computed(() => chatStreamStore.isWait);
const mobileAssistantIcon = computed(() =>
  getAssistantImageBySize(props.assistant, 20)
);

function refreshViewportSoon() {
  if (typeof window === "undefined") return;
  window.setTimeout(() => viewportStore.refresh(), 50);
  window.setTimeout(() => viewportStore.refresh(), 180);
}

function openDrawer() {
  if (isAppShellActionBlocked.value) return;
  const activeElement =
    typeof document !== "undefined" ? document.activeElement : null;
  if (activeElement?.blur) activeElement.blur();
  appShellStore.setDrawerOpen(true);
  refreshViewportSoon();
}

function openAssistant() {
  if (isAppShellActionBlocked.value) return;
  appShellStore.openAssistantSheet();
}

function openSettings() {
  openSettingsOverlay({
    isBlocked: () => isAppShellActionBlocked.value,
  });
}

function openStudioDetail() {
  if (props.studioDetailDisabled) return;
  chatWorkspaceActions.openStudioDetail?.();
}
</script>

<style scoped lang="scss">
.studio-detail-header-button {
  display: inline-flex;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-controlBorder, #d1d5db);
  border-radius: 999px;
  background: var(--app-control, #fff);
  color: var(--app-subtle, #6b7280);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.studio-detail-header-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

:global(body.mobile-mode) .mobile-topbar {
  height: 44px;
  padding-top: 4px;
  padding-bottom: 4px;
}

:global(body.mobile-mode) .mobile-topbar .round-icon {
  width: 34px;
  height: 34px;
}

:global(body.mobile-mode) .mobile-topbar .model-trigger,
:global(body.mobile-mode) .mobile-topbar .model-trigger--assistant {
  height: 34px;
  min-width: 100px;
  font-size: var(--text-size-title-sm);
  gap: 6px;
  padding-left: 10px;
  padding-right: 10px;
}

:global(body.mobile-mode) .mobile-topbar .topbar-actions--mobile {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
}

:global(body.mobile-mode) .mobile-topbar .mobile-header-future-action {
  font-size: var(--font-size-fixed-22);
  font-weight: 900;
  line-height: 1;
}
</style>
