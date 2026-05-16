<template>
  <ChatLayout
    v-if="runtimeReady"
    :keyboard-open="layoutKeyboardOpen"
    :mode="mode"
    @select-assistant="startNewChatWithAssistant"
    @new-chat="startNewChat"
    @select-history="openHistory"
    @open-guide="openGuide"
    @open-notice="openNotice"
    @open-personalization="openPersonalization"
    @open-language="openLanguage"
    @toggle-theme="toggleTheme"
    @open-swagger="openSwagger"
    @open-playground="openPlayground"
    @open-settings="openSettings"
  >
    <ChatWorkspace
      ref="workspaceRef"
      :mode="mode"
      :readonly="isReadOnly"
      :is-mobile="isMobile"
      :assistant-label="workspaceAssistantLabel"
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
      @update:selected-model="selectedModel = $event"
      @open-drawer="openMobileDrawer"
      @toggle-theme="toggleTheme"
      @open-swagger="openSwagger"
      @open-settings="openSettings"
      @open-assistant="openAssistantFromHeader"
      @open-guide="openGuide"
      @open-notice="openNotice"
      @open-personalization="openPersonalization"
      @open-language="openLanguage"
      @open-playground="openPlayground"
      @submit="submitIfWritable"
      @prompt-focus="handlePromptFocus"
      @prompt-resize="handlePromptResize"
      @message-content-rendered="handleMessageContentRendered"
      @scroll-bottom="scrollBottom({force: true, behavior: 'smooth', stable: true})"
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
      @select="selectAssistantFromSheet"
    />

    <AppOverlayProvider
      :notice-open="noticeOpen"
      :personalization-open="personalizationOpen"
      :is-mobile="isMobile"
      :notice-title="t('notice.title')"
      :notice-subtitle="t('notice.subtitle')"
      :personalization-title="t('personalization.title')"
      :personalization-subtitle="t('personalization.subtitle')"
      @close-notice="noticeOpen = false"
      @close-personalization="personalizationOpen = false"
    >
      <template #notice>
        <NoticeView />
      </template>
      <template #personalization>
        <PersonalizationView />
      </template>
    </AppOverlayProvider>

    <LanguageSheet :open="languageSheetOpen" @close="languageSheetOpen = false" />

    <MobileSettingsPanel
      :open="mobileSettingsOpen"
      @close="mobileSettingsOpen = false"
    />
  </ChatLayout>

  <div v-else class="chat-bootstrap-loading" aria-live="polite">
    <span class="chat-bootstrap-loading__dot"></span>
  </div>
</template>

<script setup>
import {useChatContainerController} from '@/composables/chat/useChatContainerController';
import AssistantSheet from '@/components/assistant/AssistantSheet.vue';
import ChatImagePreview from '@/components/chat/ChatImagePreview.vue';
import ChatLayout from '@/components/chat/ChatLayout.vue';
import ChatWorkspace from '@/components/chat/ChatWorkspace.vue';
import LanguageSheet from '@/components/menu/LanguageSheet.vue';
import AppOverlayProvider from '@/components/overlay/AppOverlayProvider.vue';
import NoticeView from '@/views/settings/NoticeView.vue';
import PersonalizationView from '@/views/settings/PersonalizationView.vue';
import MobileSettingsPanel from '@/views/settings/MobileSettingsPanel.vue';

const props = defineProps({mode: {type: String, default: 'main'}});

const {
  t,
  runtimeReady,
  workspaceRef,
  assistants,
  models,
  selectedAssistantId,
  selectedModel,
  isModelLocked,
  isActiveModelUnavailable,
  messages,
  showScrollBottom,
  assistantSheetOpen,
  noticeOpen,
  personalizationOpen,
  languageSheetOpen,
  mobileSettingsOpen,
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
  openMobileDrawer,
  toggleTheme,
  openSwagger,
  openPlayground,
  openSettings,
  openGuide,
  openNotice,
  openPersonalization,
  openLanguage,
  openAssistantFromHeader,
  selectAssistantFromSheet,
  submitIfWritable,
  handlePromptFocus,
  handlePromptResize,
  handleMessageContentRendered,
  scrollBottom,
} = useChatContainerController(props);
</script>
