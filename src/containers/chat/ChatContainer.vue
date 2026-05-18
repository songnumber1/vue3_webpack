<template>
  <ChatLayout
    v-if="runtimeReady"
    :keyboard-open="layoutKeyboardOpen"
    :mode="mode"
    @select-assistant="startNewChatWithAssistant"
    @new-chat="startNewChat"
    @select-history="openHistory"
    @history-menu-action="handleHistoryMenuAction"
  >
    <ChatWorkspace
      ref="workspaceRef"
      :mode="mode"
      :readonly="isReadOnly"
      :is-mobile="isMobile"
      :assistant-label="workspaceAssistantLabel"
      :assistant="currentAssistant"
      :conversation-title="activeConversationTitle"
      :theme-name="themeName"
      :suggestions="suggestions"
      :selected-model="selectedModel"
      :models="models"
      :model-readonly="isModelLocked"
      :is-active-model-unavailable="isActiveModelUnavailable"
      :is-generating="isGenerating"
      :messages="messages"
      :show-scroll-bottom="showScrollBottom"
    />

    <ChatImagePreview
      :image="previewImage"
      @close="closeImagePreview"
      @load="handlePreviewLoad"
      @error="handlePreviewError"
    />

    <AssistantSheet
      :open="assistantSheetOpen"
      :assistants="assistants"
      :selected-assistant-id="selectedAssistantId"
      @close="assistantSheetOpen = false"
      @select="startNewChatWithAssistant"
    />

    <AppOverlayProvider
      :notice-open="noticeOpen"
      :privacy-open="privacyOpen"
      :personalization-open="personalizationOpen"
      :is-mobile="isMobile"
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
    </AppOverlayProvider>

    <LanguageSheet
      :open="languageSheetOpen"
      @close="languageSheetOpen = false"
    />

    <MobileSettingsPanel
      :open="mobileSettingsOpen"
      @close="mobileSettingsOpen = false"
    />

    <ChatHistoryDialog
      :open="historyDialogOpen"
      :is-mobile="isMobile"
      :mode="historyDialogMode"
      :title="historyDialogTitle"
      :message="historyDialogMessage"
      :initial-title="historyDialogTarget?.title || ''"
      @cancel="closeHistoryDialog"
      @confirm="confirmHistoryDialog"
    />

    <ResponsiveOverlay
      :open="historyNoticeOpen"
      :is-mobile="isMobile"
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
import {provide} from "vue";
import {useChatContainerController} from "@/composables/chat/useChatContainerController";
import {
  CHAT_ACTIONS_KEY,
  WORKSPACE_ACTIONS_KEY,
} from "@/composables/chat/chatActionContext";
import AssistantSheet from "@/components/assistant/AssistantSheet.vue";
import ChatImagePreview from "@/components/chat/ChatImagePreview.vue";
import ChatLayout from "@/components/chat/ChatLayout.vue";
import ChatWorkspace from "@/components/chat/ChatWorkspace.vue";
import LanguageSheet from "@/components/menu/LanguageSheet.vue";
import AppOverlayProvider from "@/components/overlay/AppOverlayProvider.vue";
import NoticeView from "@/views/settings/NoticeView.vue";
import PrivacyPolicyView from "@/views/settings/PrivacyPolicyView.vue";
import PersonalizationView from "@/views/settings/PersonalizationView.vue";
import MobileSettingsPanel from "@/views/settings/MobileSettingsPanel.vue";
import ChatHistoryDialog from "@/components/navigation/parts/ChatHistoryDialog.vue";
import ResponsiveOverlay from "@/components/overlay/ResponsiveOverlay.vue";

const props = defineProps({mode: {type: String, default: "main"}});

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
  closeImagePreview,
  handlePreviewLoad,
  handlePreviewError,
  startNewChatWithAssistant,
  startNewChat,
  openHistory,
  handleHistoryMenuAction,
  closeHistoryDialog,
  confirmHistoryDialog,
  openMobileDrawer,
  toggleTheme,
  openSwagger,
  openPlayground,
  openSettings,
  openGuide,
  openNotice,
  openPrivacy,
  openTerms,
  openPersonalization,
  openLanguage,
  openAssistantFromHeader,
  submitIfWritable,
  handlePromptFocus,
  handlePromptResize,
  handleMessageContentRendered,
  scrollBottom,
} = useChatContainerController(props);

provide(CHAT_ACTIONS_KEY, {
  openDrawer: openMobileDrawer,
  toggleTheme,
  openSwagger,
  openSettings,
  openAssistant: openAssistantFromHeader,
  openGuide,
  openNotice,
  openPrivacy,
  openTerms,
  openPersonalization,
  openLanguage,
  openPlayground,
});

provide(WORKSPACE_ACTIONS_KEY, {
  submit: submitIfWritable,
  updateSelectedModel: (val) => {
    selectedModel.value = val;
  },
  handlePromptFocus,
  handlePromptResize,
  handleMessageContentRendered,
  scrollBottom: () =>
    scrollBottom({force: true, behavior: "smooth", stable: true}),
});
</script>
