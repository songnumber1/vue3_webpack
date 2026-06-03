<template>
  <ChatLayout
    v-if="runtimeReady"
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
      :assistants="assistants"
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

import {computed, provide, watch} from "vue";
import {storeToRefs} from "pinia";
import {useRoute, useRouter} from "vue-router";
import {useChatContainerController} from "@/composables/chat/useChatContainerController";
import {
  CHAT_ACTIONS_KEY,
  CHAT_WORKSPACE_STATE_KEY,
  PROMPT_STATE_KEY,
  WORKSPACE_ACTIONS_KEY,
} from "@/composables/chat/chatActionContext";
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
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useAssistantStore} from "@/stores/assistantStore";

/**
 * [ChatContainer 연결 구조]
 * 이 파일은 UI를 직접 계산하기보다 useChatContainerController()에서 받은 상태/action을 하위 컴포넌트에 배선합니다.
 * Header/Workspace/Prompt/ImagePreview/Sheet는 서로 직접 import하지 않고 provide/inject 또는 props/event로 연결됩니다.
 * 따라서 문제 추적 시 '렌더 위치(ChatContainer)'와 '상태 변경 위치(controller/store)'를 나누어 확인해야 합니다.
 */

const route = useRoute();
const router = useRouter();
const systemSettingsStore = useSystemSettingsStore();
const assistantStore = useAssistantStore();
const {showVirtualKeyboardDebug} = storeToRefs(systemSettingsStore);
const ASSISTANT_STUDIO_PORTAL_ID = "assistant-studio";
const CONNECTOR_STORE_PORTAL_ID = "connector-store";
const routeMode = computed(() => {
  if (route.name === "shared") return "shared";
  if (["studio", "connector-store"].includes(route.name)) return "studio";
  if (route.name === "chat-search") return "chat-search";
  if (route.name === "chat" || route.name === "chat-entry") return "chat";
  return "main";
});
const controllerProps = {
  get mode() {
    return routeMode.value;
  },
};

function syncAssistantSelectionWithRoute() {
  const studioAssistant = assistantStore.assistantMap[ASSISTANT_STUDIO_PORTAL_ID];
  const connectorAssistant = assistantStore.assistantMap[CONNECTOR_STORE_PORTAL_ID];
  if (route.name === "studio") {
    if (studioAssistant && assistantStore.selectedAssistantId !== ASSISTANT_STUDIO_PORTAL_ID) {
      assistantStore.selectAssistant(ASSISTANT_STUDIO_PORTAL_ID);
    }
    return;
  }
  if (route.name === "connector-store") {
    if (connectorAssistant && assistantStore.selectedAssistantId !== CONNECTOR_STORE_PORTAL_ID) {
      assistantStore.selectAssistant(CONNECTOR_STORE_PORTAL_ID);
    }
    return;
  }

  if ([ASSISTANT_STUDIO_PORTAL_ID, CONNECTOR_STORE_PORTAL_ID].includes(assistantStore.selectedAssistantId)) {
    const fallbackAssistant = assistantStore.assistants.find(
      (assistant) => ![ASSISTANT_STUDIO_PORTAL_ID, CONNECTOR_STORE_PORTAL_ID].includes(assistant.id)
        && assistant.type !== "studio"
        && assistant.type !== "mcp"
        && !assistant.isStudio
    );
    if (fallbackAssistant) assistantStore.selectAssistant(fallbackAssistant.id);
  }
}

watch(
  [() => route.name, () => assistantStore.assistants.length],
  syncAssistantSelectionWithRoute,
  {immediate: true}
);

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
  isHistoryHydrating,
  finishHistoryHydration,
  autoScrollOnAnswer,
  closeImagePreview,
  handlePreviewLoad,
  handlePreviewError,
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
  openSystem,
  openLanguage,
  openAssistantFromHeader,
  logout,
  submit,
  regenerate,
  refreshPromptViewport,
  handleMessageContentRendered,
  scrollBottom,
  handleSystemSettingsApplied,
} = useChatContainerController(controllerProps);

const showVirtualKeyboardDebugButton = computed(
  () => isMobile.value && showVirtualKeyboardDebug.value
);



/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
function handleAssistantNewChat(assistantId) {
  if (assistantId === "assistant-studio" || assistantId === "connector-store") {
    assistantStore.selectAssistant(assistantId);
    assistantSheetOpen.value = false;
    router
      .push({name: assistantId === "connector-store" ? "connector-store" : "studio"})
      .catch(() => {});
    return;
  }
  startNewChat({assistantId});
}

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
function handleWorkspaceScrollBottom() {
  scrollBottom({force: true, behavior: "smooth", stable: true});
}

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */

function setWorkspaceRef(el) {
  workspaceRef.value = el;
}

function handleMobileSettingsDesktopOpen(target) {
  mobileSettingsOpen.value = false;
  if (target === "notice") {
    noticeOpen.value = true;
    return;
  }
  if (target === "privacy") {
    privacyOpen.value = true;
    return;
  }
  if (target === "personalization") {
    personalizationOpen.value = true;
    return;
  }
  if (target === "system") {
    systemOpen.value = true;
  }
}

provide(
  CHAT_WORKSPACE_STATE_KEY,
  computed(() => ({
    mode: routeMode.value,
    readonly: isReadOnly.value,
    isMobile: isMobile.value,
    assistantLabel: workspaceAssistantLabel.value,
    assistant: currentAssistant.value,
    conversationTitle: activeConversationTitle.value,
    themeName: themeName.value,
    suggestions: suggestions.value,
    isActiveModelDeleted: false,
    isActiveModelUnavailable: isActiveModelUnavailable.value,
    isGenerating: isGenerating.value,
    messages: messages.value,
    showScrollBottom: showScrollBottom.value,
    autoScrollOnAnswer: autoScrollOnAnswer.value,
    isHistoryHydrating: isHistoryHydrating.value,
  }))
);

provide(
  PROMPT_STATE_KEY,
  computed(() => ({
    isMobile: isMobile.value,
    floating: false,
    showHelp: false,
    selectedModel: selectedModel.value,
    models: models.value,
    disabled: false,
    generating: isGenerating.value,
    modelReadonly: isModelLocked.value,
    placeholder: "",
  }))
);

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
  openSystem,
  openLanguage,
  openPlayground,
  logout,
  newChat: startNewChat,
  selectHistory: openHistory,
  historyMenuAction: handleHistoryMenuAction,
  selectAssistant: handleAssistantNewChat,
});

provide(WORKSPACE_ACTIONS_KEY, {
  submit: (payload) => {
    if (isGenerating.value) return;
    submit(payload);
  },
  regenerate,
  updateSelectedModel: (val) => {
    selectedModel.value = val;
  },
  handlePromptFocus: refreshPromptViewport,
  handlePromptResize: refreshPromptViewport,
  handleMessageContentRendered,
  scrollBottom: handleWorkspaceScrollBottom,
  handleHistoryHydrated: (options) => finishHistoryHydration(options),
});
</script>

<style scoped lang="scss">
.chat-container-root {
  min-width: 0;
  min-height: 0;
}
</style>
