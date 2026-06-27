<template>
  <header
    class="mobile-topbar"
    :class="{'mobile-topbar--desktop-main': isDesktopMain}"
  >
    <div class="topbar-left">
      <button
        class="round-icon menu-toggle"
        type="button"
        :aria-label="t('chat.openSidebar')"
        @click="openDrawer"
      >
        <span class="icon-lines"></span>
      </button>

      <template v-if="showMobileAssistant">
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
          @click.stop="$emit('studio-detail')"
        >
          ⓘ
        </button>
      </template>

      <div
        v-else-if="showDesktopConversationTitle"
        class="conversation-title-wrap conversation-title-wrap--chat"
      >
        <img
          class="assistant-brand-logo assistant-brand-logo--header"
          :src="headerAssistantIcon"
          alt=""
          aria-hidden="true"
        />
        <strong>{{ assistantLabel }}</strong>
        <span>{{ conversationTitle }}</span>
        <button
          v-if="showStudioDetailButton"
          class="studio-detail-header-button studio-detail-header-button--desktop"
          type="button"
          :disabled="studioDetailDisabled"
          aria-label="Studio 상세 보기"
          title="Studio 상세 보기"
          @click.stop="$emit('studio-detail')"
        >
          ⓘ
        </button>
      </div>

      <div
        v-else-if="showDesktopMainTitle"
        class="conversation-title-wrap conversation-title-wrap--main"
      >
        <img
          class="assistant-brand-logo assistant-brand-logo--desktop"
          :src="desktopAssistantIcon"
          alt=""
          aria-hidden="true"
        />
        <span class="conversation-title-copy">
          <strong>{{ assistantLabel }}</strong>
          <span>{{ t("chat.startQuestion") }}</span>
        </span>
      </div>
    </div>

    <div v-if="isMobile" class="topbar-actions topbar-actions--mobile">
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

    <div
      v-else
      class="topbar-actions topbar-actions--desktop topbar-actions--desktop-chat"
    ></div>
  </header>
</template>

<script setup>
/**
 * @file components/chat/ChatHeader.vue
 * @description 채팅 UI 컴포넌트입니다. 메시지, 헤더, 입력 영역, 이미지 프리뷰 등 실제 화면 렌더를 담당합니다.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import {getAssistantImageBySize} from "@/constants/assistantImages";
import {useResponsiveLayoutStore} from "@/stores/responsiveLayoutStore";
import {useNavigationStore} from "@/stores/navigationStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useViewportStore} from "@/stores/viewportStore";
import {useAppShellStore} from "@/stores/appShellStore";
import {openSettingsOverlay} from "@/composables/overlay/responseOverlayActions";
import {
  NAVIGATION_LOCK_SCOPES,
  useNavigationLockStore,
} from "@/stores/navigationLockStore";

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({
  mode: {type: String, default: "main"},
  assistantLabel: {type: String, default: "Assistant"},
  assistant: {type: Object, default: null},
  conversationTitle: {type: String, default: ""},
  themeName: {type: String, default: "dark"},
  showStudioDetailButton: {type: Boolean, default: false},
  studioDetailDisabled: {type: Boolean, default: false},
});

defineEmits(["studio-detail"]);

const {t} = useI18n();
const navigationStore = useNavigationStore();
const chatStreamStore = useChatStreamStore();
const navigationLockStore = useNavigationLockStore();
const isGlobalLocked = computed(() =>
  navigationLockStore.isLocked(NAVIGATION_LOCK_SCOPES.global)
);
const isChatHistoryLocked = computed(() =>
  navigationLockStore.isLocked(NAVIGATION_LOCK_SCOPES.chatHistory)
);
const viewportStore = useViewportStore();
const isAppShellActionBlocked = computed(
  () =>
    isGlobalLocked.value ||
    isChatHistoryLocked.value ||
    chatStreamStore.isStreaming
);
const appShellStore = useAppShellStore();
const openAssistantSheet = () => appShellStore.openAssistantSheet();
const responsiveLayoutStore = useResponsiveLayoutStore();
const isMobile = computed(() => Boolean(responsiveLayoutStore.isMobile));
const desktopAssistantIcon = computed(() =>
  getAssistantImageBySize(props.assistant, 48)
);
const mobileAssistantIcon = computed(() =>
  getAssistantImageBySize(props.assistant, 20)
);
const headerAssistantIcon = computed(() =>
  getAssistantImageBySize(props.assistant, 20)
);

const isMainPage = computed(() => props.mode === "main");
const isDesktopMain = computed(() => isMainPage.value && !isMobile.value);
const showMobileAssistant = computed(() => isMobile.value);
const showDesktopConversationTitle = computed(
  () => (props.mode === "chat" || props.mode === "shared") && !isMobile.value
);
const showDesktopMainTitle = computed(
  () => props.mode === "main" && !isMobile.value
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
  navigationStore.setDrawerOpen(true);
  refreshViewportSoon();
}

function openAssistant() {
  if (isAppShellActionBlocked.value) return;
  openAssistantSheet();
}

function openSettings() {
  openSettingsOverlay({
    isMobile,
    isBlocked: () => isAppShellActionBlocked.value,
  });
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

.studio-detail-header-button--desktop {
  width: 24px;
  height: 24px;
  font-size: 15px;
}

/* Compact mobile header sizing is local to ChatHeader. */
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

:global(body.desktop-mode) .topbar-actions--desktop-chat {
  width: auto !important;
  min-width: 0 !important;
  overflow: visible !important;
  pointer-events: auto !important;
}
</style>
