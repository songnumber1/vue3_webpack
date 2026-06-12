<template>
  <ChatLayout
    v-if="shellReady"
    :keyboard-open="layoutKeyboardOpen"
    :mode="routeMode"
  >
    <slot :set-workspace-ref="setWorkspaceRef" />

    <!-- 이미지 크게 보기 -->
    <ChatImagePreview
      :image="previewImage"
      @close="closeImagePreview"
      @load="handlePreviewLoad"
      @error="handlePreviewError"
    />

    <AssistantSelectSheet
      :open="assistantSheetOpen"
      :assistants="visibleAssistants"
      :selected-assistant-id="selectedAssistantId"
      @close="assistantSheetOpen = false"
      @select="handleAssistantNewChat"
    />

    <OverlayPortalProvider
      :notice-open="noticeOpen"
      :privacy-open="privacyOpen"
      :personalization-open="personalizationOpen"
      :notice-title="t('notice.title')"
      :notice-subtitle="t('notice.subtitle')"
      :privacy-title="t('legal.privacy.title')"
      :privacy-subtitle="t('legal.privacy.description')"
      :personalization-title="t('personalization.title')"
      :personalization-subtitle="t('personalization.subtitle')"
      @close-notice="noticeOpen = false"
      @close-privacy="privacyOpen = false"
      @close-personalization="personalizationOpen = false"
    >
      <template #notice>
        <NoticeView />
      </template>
      <template #privacy>
        <PrivacyPolicyView />
      </template>
      <template #personalization>
        <PersonalizationView />
      </template>
    </OverlayPortalProvider>

    <ResponsiveOverlay
      :open="systemOpen"
      :title="t('common.system')"
      :subtitle="t('menu.systemSummary')"
      panel-class="responsive-panel--system-settings"
      @close="systemOpen = false"
    >
      <SystemSettingsView
        @close="systemOpen = false"
        @applied="handleSystemSettingsApplied"
      />
    </ResponsiveOverlay>

    <LanguageSelectSheet
      :open="languageSheetOpen"
      @close="languageSheetOpen = false"
    />

    <MobileSettingsPanel
      :open="mobileSettingsOpen"
      @close="mobileSettingsOpen = false"
      @desktop-open="handleMobileSettingsDesktopOpen"
      @applied="handleSystemSettingsApplied"
    />

    <StudioDetailViewer
      :open="studioDetailOpen"
      :studio="studioDetailStudio"
      :is-mobile="isMobile"
      :allow-actions="true"
      :actions-disabled="isStudioDetailBlocked"
      @close="closeStudioDetail"
      @edit="handleStudioDetailEdit"
      @delete="handleStudioDetailDelete"
    />

    <VirtualKeyboardDebug :visible="showVirtualKeyboardDebugButton" />

    <ChatHistoryActionDialog
      :open="historyDialogOpen"
      :mode="historyDialogMode"
      :title="historyDialogTitle"
      :message="historyDialogMessage"
      :initial-title="historyDialogTarget?.title || ''"
      @cancel="closeHistoryDialog"
      @confirm="confirmHistoryDialog"
    />

    <ResponsiveOverlay
      :open="historyNoticeOpen"
      :title="t('common.notice')"
      mobile-mode="dialog"
      @close="historyNoticeOpen = false"
    >
      <div class="chat-history-dialog">
        <p class="chat-history-dialog__message">{{ historyNoticeMessage }}</p>
        <div class="chat-history-dialog__actions">
          <button
            class="playground-button"
            type="button"
            @click="historyNoticeOpen = false"
          >
            {{ t("common.confirm") }}
          </button>
        </div>
      </div>
    </ResponsiveOverlay>
  </ChatLayout>

  <div v-else class="chat-bootstrap-loading" aria-live="polite">
    <span class="chat-bootstrap-loading__dot"></span>
  </div>
</template>

<script setup>
/**
 * @file containers/chat/ChatContainer.vue
 * @description 채팅 화면의 최상위 조립 계층입니다. Controller에서 받은 상태와 action을 하위 Vue 컴포넌트에 연결합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";
import {storeToRefs} from "pinia";
import {useRoute, useRouter} from "vue-router";
import {useChatContainerController} from "@/composables/chat/useChatContainerController";
import {useAppRuntimeStore} from "@/stores/appRuntimeStore";
import {useChatContainerProviders} from "@/composables/chat/container/useChatContainerProviders";
import {useChatContainerInteractionLocks} from "@/composables/chat/container/useChatContainerInteractionLocks";
import AssistantSelectSheet from "@/components/assistant/AssistantSelectSheet.vue";
import ChatImagePreview from "@/components/chat/ChatImagePreview.vue";
import ChatLayout from "@/components/chat/ChatLayout.vue";
import LanguageSelectSheet from "@/components/menu/LanguageSelectSheet.vue";
import OverlayPortalProvider from "@/components/overlay/OverlayPortalProvider.vue";
import NoticeView from "@/views/settings/NoticeView.vue";
import PrivacyPolicyView from "@/views/settings/PrivacyPolicyView.vue";
import PersonalizationView from "@/views/settings/PersonalizationView.vue";
import SystemSettingsView from "@/views/settings/SystemSettingsView.vue";
import MobileSettingsPanel from "@/views/settings/MobileSettingsPanel.vue";
import ChatHistoryActionDialog from "@/components/navigation/controls/ChatHistoryActionDialog.vue";
import ResponsiveOverlay from "@/components/overlay/ResponsiveOverlay.vue";
import VirtualKeyboardDebug from "@/components/debug/VirtualKeyboardDebug.vue";
import StudioDetailViewer from "@/components/studio/StudioDetailViewer.vue";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useRouteMode} from "@/composables/route/useRouteMode";
import {useChatStudioPortalActions} from "@/composables/chat/studio/useChatStudioPortalActions";

/**
 * [ChatContainer 연결 구조]
 * 이 파일은 UI를 직접 계산하기보다 useChatContainerController()에서 받은 상태/action을 하위 컴포넌트에 배선합니다.
 * Header/Workspace/Prompt/ImagePreview/Sheet는 서로 직접 import하지 않고 provide/inject 또는 props/event로 연결됩니다.
 * 따라서 문제 추적 시 '렌더 위치(ChatContainer)'와 '상태 변경 위치(controller/store)'를 나누어 확인해야 합니다.
 */

const route = useRoute();
const router = useRouter();
const appRuntimeStore = useAppRuntimeStore();
const systemSettingsStore = useSystemSettingsStore();
const {showVirtualKeyboardDebug} = storeToRefs(systemSettingsStore);
const routeMode = useRouteMode(route);
const controllerProps = {
  get mode() {
    return routeMode.value;
  },
};

const {
  t,
  runtimeReady,
  workspaceRef,
  assistants,
  currentAssistant,
  models,
  selectedAssistantId,
  selectedModel,
  isModelLocked,
  isActiveModelUnavailable,
  messages,
  showScrollBottom,
  assistantSheetOpen,
  noticeOpen,
  privacyOpen,
  personalizationOpen,
  systemOpen,
  languageSheetOpen,
  mobileSettingsOpen,
  historyDialogOpen,
  historyDialogMode,
  historyDialogTarget,
  historyDialogTitle,
  historyDialogMessage,
  historyNoticeOpen,
  historyNoticeMessage,
  previewImage,
  themeName,
  isMobile,
  layoutKeyboardOpen,
  isReadOnly,
  activeConversationTitle,
  workspaceAssistantLabel,
  suggestions,
  isGenerating,
  isHistoryRendering,
  historyMarkdownVisible,
  historyMessagesLoaded,
  hasPreviousHistoryMessages,
  historyLazyTopThreshold,
  historyLazyChunkSize,
  messageRenderPolicy,
  pcHistoryLazyInitialCount,
  pcHistoryLazyAppendCount,
  pcHistoryLazyTopThresholdPx,
  mobileHistoryLazyInitialCount,
  mobileHistoryLazyAppendCount,
  loadPreviousHistoryMessages,
  continueProgressiveInitialHistoryRender,
  finishHistoryRender,
  revealHistoryMarkdown,
  autoScrollOnAnswer,
  closeImagePreview,
  handlePreviewLoad,
  handlePreviewError,
  startNewChat,
  handleHistoryMenuAction,
  closeHistoryDialog,
  confirmHistoryDialog,
  submit,
  regenerate,
  refreshPromptViewport,
  handleMessageContentRendered,
  scrollBottom,
  handleSystemSettingsApplied,
  handleMobileSettingsDesktopOpen,
} = useChatContainerController(controllerProps);

const shellReady = computed(
  () => runtimeReady.value || appRuntimeStore.initialized
);

const showVirtualKeyboardDebugButton = computed(
  () => isMobile.value && showVirtualKeyboardDebug.value
);

const {chatPageLock, isStudioDetailBlocked} = useChatContainerInteractionLocks({
  isReadOnly,
  isGenerating,
  isHistoryRendering,
  isActiveModelUnavailable,
});

const {
  visibleAssistants,
  studioDetailStudio,
  studioDetailOpen,
  closeStudioDetail,
  openStudioDetail,
  handleStudioDetailEdit,
  handleStudioDetailDelete,
  handleAssistantNewChat,
} = useChatStudioPortalActions({
  route,
  router,
  assistants,
  currentAssistant,
  selectedModel,
  assistantSheetOpen,
  isStudioDetailBlocked,
  startNewChat,
});

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
function setWorkspaceRef(el) {
  workspaceRef.value = el;
}

useChatContainerProviders({
  routeMode,
  isReadOnly,
  isMobile,
  workspaceAssistantLabel,
  currentAssistant,
  activeConversationTitle,
  themeName,
  suggestions,
  isActiveModelUnavailable,
  isGenerating,
  messages,
  showScrollBottom,
  autoScrollOnAnswer,
  isHistoryRendering,
  historyMarkdownVisible,
  historyMessagesLoaded,
  hasPreviousHistoryMessages,
  historyLazyTopThreshold,
  historyLazyChunkSize,
  messageRenderPolicy,
  pcHistoryLazyInitialCount,
  pcHistoryLazyAppendCount,
  pcHistoryLazyTopThresholdPx,
  mobileHistoryLazyInitialCount,
  mobileHistoryLazyAppendCount,
  selectedModel,
  models,
  isModelLocked,
  chatPageLock,
  handleHistoryMenuAction,
  submit,
  regenerate,
  refreshPromptViewport,
  handleMessageContentRendered,
  scrollBottom,
  finishHistoryRender,
  revealHistoryMarkdown,
  loadPreviousHistoryMessages,
  continueProgressiveInitialHistoryRender,
  openStudioDetail,
});
</script>

<style scoped lang="scss">
.chat-container-root {
  min-width: 0;
  min-height: 0;
}
</style>
