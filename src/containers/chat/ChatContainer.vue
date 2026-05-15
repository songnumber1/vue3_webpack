<!--
@file ChatContainer.vue
@description Chat feature container that wires route state, runtime state and reusable chat layout components.
@author OpenAI
-->

<template>
  <ChatLayout
    v-if="runtimeReady"
    :histories="histories"
    :assistants="assistants"
    :selected-assistant-id="selectedAssistantId"
    :active-history-id="activeHistoryId"
    :sidebar-collapsed="sidebarCollapsed"
    :drawer-open="drawerOpen"
    :collapsed-recent-open="collapsedRecentOpen"
    :keyboard-open="layoutKeyboardOpen"
    :mode="mode"
    @update:selected-assistant-id="startNewChatWithAssistant"
    @update:sidebar-collapsed="sidebarCollapsed = $event"
    @update:drawer-open="drawerOpen = $event"
    @update:collapsed-recent-open="collapsedRecentOpen = $event"
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
      @open-drawer="drawerOpen = true"
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
      @scroll-bottom="
        scrollBottom({force: true, behavior: 'smooth', stable: true})
      "
    />

    <ChatImagePreview
      :image="previewImage"
      @close="closeImagePreview"
      @load="handlePreviewLoad"
      @error="handlePreviewError"
    />

    <ChatAssistantSheet
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

    <LanguageSheet
      :open="languageSheetOpen"
      @close="languageSheetOpen = false"
    />

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
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useAppContext} from "@/composables/useAppContext";
import {useAutoScroll} from "@/composables/useAutoScroll";
import {useChatRuntime} from "@/composables/useChatRuntime";
import {useChatSubmit} from "@/composables/useChatSubmit";
import {useImagePreview} from "@/composables/useImagePreview";
import {loadSharedConversation} from "@/composables/useSharedChat";
import {useViewportGuard} from "@/composables/useViewportGuard";
import {addMediaQueryListener} from "@/utils/dom";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {PROMPT_SUGGESTION_LIMIT} from "@/constants/promptSuggestions";
import ChatAssistantSheet from "@/components/chat/ChatAssistantSheet.vue";
import ChatImagePreview from "@/components/chat/ChatImagePreview.vue";
import ChatLayout from "@/components/chat/ChatLayout.vue";
import ChatWorkspace from "@/components/chat/ChatWorkspace.vue";
import LanguageSheet from "@/components/menu/LanguageSheet.vue";
import AppOverlayProvider from "@/components/overlay/AppOverlayProvider.vue";
import NoticeView from "@/views/settings/NoticeView.vue";
import PersonalizationView from "@/views/settings/PersonalizationView.vue";
import MobileSettingsPanel from "@/views/settings/MobileSettingsPanel.vue";

const props = defineProps({mode: {type: String, default: "main"}});

const {t, locale} = useI18n();
const router = useRouter();
const route = useRoute();
const {theme} = useAppContext();
const runtime = useChatRuntime();
const {
  assistants,
  currentAssistant,
  histories,
  models,
  selectedAssistantId,
  selectedModel,
  isModelLocked,
  isActiveModelUnavailable,
  activeSession,
  ensureConversation,
  setConversation,
  createLocalConversation,
  clearCurrentChatSelection,
  appendUserAndAssistantMessages,
  selectAssistantForNewChat,
  currentExamplePrompts,
  getHistory,
  revokeMessageAttachments,
} = runtime;

const workspaceRef = ref(null);
const {scrollToBottom} = useAutoScroll({value: null});
const {keyboardOpen, refreshViewport} = useViewportGuard({
  onChange: ({isCompact, keyboardOpen: isKeyboardOpen}) => {
    if (props.mode !== "main" && isCompact && isKeyboardOpen)
      scrollBottom({stable: true});
  },
});
const themeName = ref(theme.current);
const drawerOpen = ref(false);
const sidebarCollapsed = ref(false);
const collapsedRecentOpen = ref(false);
const isMobile = ref(false);
const messages = ref([]);
const showScrollBottom = ref(false);
const assistantSheetOpen = ref(false);
const noticeOpen = ref(false);
const personalizationOpen = ref(false);
const languageSheetOpen = ref(false);
const mobileSettingsOpen = ref(false);
const {previewImage, closeImagePreview, handlePreviewLoad, handlePreviewError} =
  useImagePreview();
let removeMobileMediaQueryListener = null;
let bottomStateTimer = 0;
let forceBottomUntil = 0;

const layoutKeyboardOpen = computed(
  () => props.mode !== "main" && keyboardOpen.value
);

const isReadOnly = computed(() => props.mode === "shared");
const activeHistoryId = computed(() => {
  if (props.mode === "chat") return route.params.id;
  if (props.mode === "shared") return route.params.shareId;
  return null;
});
const activeHistory = computed(() => getHistory(activeHistoryId.value));
const activeConversationTitle = computed(() => {
  if (props.mode === "shared")
    return `공유 대화 ${activeHistoryId.value || ""}`.trim();
  return activeHistory.value?.title || "";
});

const workspaceAssistantLabel = computed(() => {
  if (activeSession.value?.displayAssistantLabel) {
    return activeSession.value.displayAssistantLabel;
  }
  if (
    activeSession.value?.assistantLabel &&
    !activeSession.value?.isModelUnavailable
  ) {
    return activeSession.value.assistantLabel;
  }
  return currentAssistant.value?.label || "Assistant";
});

const suggestions = computed(() => {
  const assistantPrompts = currentExamplePrompts.value || [];
  const isEnglish = locale.value === "en";

  return assistantPrompts
    .slice(0, PROMPT_SUGGESTION_LIMIT)
    .map((prompt) => {
      const localizedTitle = isEnglish
        ? prompt.titleEn || prompt.titleKo
        : prompt.titleKo || prompt.titleEn;
      const localizedContent = isEnglish
        ? prompt.contentEn || prompt.contentKo || localizedTitle
        : prompt.contentKo || prompt.contentEn || localizedTitle;
      const text = localizedTitle || localizedContent;
      const content = localizedContent || localizedTitle;

      return {
        id: prompt.id,
        text,
        title: content || text,
        prompt: content || text,
      };
    })
    .filter((item) => item.text && item.prompt);
});

/**
 * getMessageListRef 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getMessageListRef() {
  const exposed = workspaceRef.value?.listRef;
  if (exposed?.scrollToBottom) return exposed;
  if (exposed?.value?.scrollToBottom) return exposed.value;
  return null;
}

/**
 * updateMobileState 처리 함수입니다.
 * @returns {void}
 */
function updateMobileState() {
  isMobile.value = Boolean(
    window.matchMedia?.("(max-width: 900px)")?.matches ||
    window.innerWidth <= 900 ||
    document.querySelector(".app-container--mobile")
  );
}

/**
 * markForceBottom 처리 함수입니다.
 * @param {*} duration 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function markForceBottom(duration = 1800) {
  forceBottomUntil = Date.now() + duration;
}

/**
 * shouldKeepForceBottom 처리 함수입니다.
 * @returns {boolean|*} 처리 결과를 반환합니다.
 */
function shouldKeepForceBottom() {
  return Date.now() <= forceBottomUntil;
}

/**
 * scrollBottom 처리 함수입니다.
 * @param {*} options 함수 실행에 필요한 입력값입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
async function scrollBottom(options = {}) {
  const list = getMessageListRef();
  if (list?.scrollToBottom) {
    list.scrollToBottom(options);
  } else {
    await scrollToBottom(options);
  }
  updateScrollBottomButton();
}

/**
 * updateScrollBottomButton 처리 함수입니다.
 * @returns {void}
 */
function updateScrollBottomButton() {
  const list = getMessageListRef();
  showScrollBottom.value =
    (props.mode === "chat" || props.mode === "shared") &&
    Boolean(list && !list.isAtBottom?.());
}

/**
 * scheduleBottomStateCheck 처리 함수입니다.
 * @returns {void}
 */
function scheduleBottomStateCheck() {
  window.clearTimeout(bottomStateTimer);
  bottomStateTimer = window.setTimeout(updateScrollBottomButton, 80);
}

/**
 * handleMessageContentRendered 처리 함수입니다.
 * @returns {void}
 */
function handleMessageContentRendered() {
  if (shouldKeepForceBottom()) scrollBottom({force: true, stable: true});
  scheduleBottomStateCheck();
}

/**
 * handlePromptFocus 처리 함수입니다.
 * @returns {void}
 */
function handlePromptFocus() {
  if (isReadOnly.value || isActiveModelUnavailable.value) return;
  refreshViewport();
  if (props.mode === "main") return;
  scrollBottom({stable: true, force: isMobile.value});
}

/**
 * handlePromptResize 처리 함수입니다.
 * @returns {void}
 */
function handlePromptResize() {
  if (isReadOnly.value || isActiveModelUnavailable.value) return;
  if (props.mode === "main") return;
  scrollBottom({stable: true, force: isMobile.value});
}

/**
 * startNewChat 처리 함수입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
async function startNewChat() {
  revokeMessageAttachments(messages.value);
  messages.value = [];
  clearCurrentChatSelection();
  drawerOpen.value = false;
  collapsedRecentOpen.value = false;
  forceBottomUntil = 0;
  await router.push("/");
}

/**
 * Starts a new chat context with the selected assistant.
 * Existing chat sessions lock their model, so assistant changes always reset to main.
 * @param {string} id Selected assistant id.
 * @returns {Promise<void>} Navigation completion promise.
 */
async function startNewChatWithAssistant(id) {
  revokeMessageAttachments(messages.value);
  messages.value = [];
  await selectAssistantForNewChat(id);
  drawerOpen.value = false;
  collapsedRecentOpen.value = false;
  assistantSheetOpen.value = false;
  forceBottomUntil = 0;
  await router.push("/");
}

/**
 * openHistory 처리 함수입니다.
 * @param {*} item 함수 실행에 필요한 입력값입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
async function openHistory(item) {
  drawerOpen.value = false;
  collapsedRecentOpen.value = false;
  await router.push({name: "chat", params: {id: item.id}});
}

/**
 * loadRouteConversation 처리 함수입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
async function loadRouteConversation() {
  if (props.mode === "main") {
    messages.value = [];
    clearCurrentChatSelection();
    return;
  }

  if (props.mode === "shared") {
    messages.value = await loadSharedConversation(activeHistoryId.value);
    markForceBottom();
    await nextTick();
    await scrollBottom({behavior: "auto", force: true, stable: true});
    return;
  }

  const history = getHistory(activeHistoryId.value);
  if (!history) {
    await router.replace("/");
    return;
  }
  messages.value = await ensureConversation(history.id);
  markForceBottom();
  await nextTick();
  await scrollBottom({behavior: "auto", force: true, stable: true});
}

/**
 * renderAfterStream 처리 함수입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
async function renderAfterStream() {
  markForceBottom(1000);
  await renderMermaidInElement(document.querySelector(".message-list"), {
    force: true,
  });
  scrollBottom({force: true, stable: true});
}

const {isGenerating, handleSubmit} = useChatSubmit({
  router,
  route,
  histories,
  messages,
  createLocalConversation,
  appendUserAndAssistantMessages,
  setConversation,
  scrollBottom: async (options) => {
    markForceBottom(2500);
    await scrollBottom(options);
  },
  renderAfterStream,
});

/**
 * submitIfWritable 처리 함수입니다.
 * @param {*} payload 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function submitIfWritable(payload) {
  if (isReadOnly.value || isActiveModelUnavailable.value) return;
  handleSubmit(payload);
}

/**
 * toggleTheme 처리 함수입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
async function toggleTheme() {
  theme.toggle();
  themeName.value = theme.current;
  await nextTick();
  await renderMermaidInElement(document.querySelector(".message-list"), {
    force: true,
  });
  scrollBottom({stable: true});
}

/**
 * openSwagger 처리 함수입니다.
 * @returns {void}
 */
function openSwagger() {
  router.push("/swagger");
}

/**
 * Opens the UI playground route.
 * @returns {void}
 */
function openPlayground() {
  drawerOpen.value = false;
  router.push({name: "playground"});
}

/**
 * openSettings 처리 함수입니다.
 * @returns {void}
 */
function openSettings() {
  if (isMobile.value) {
    drawerOpen.value = false;
    mobileSettingsOpen.value = true;
    return;
  }
  openPersonalization();
}

/**
 * Opens the guide page from desktop header or mobile service menu.
 * @returns {void}
 */
function openGuide() {
  drawerOpen.value = false;
  router.push({name: "guide"});
}

/**
 * Opens the responsive notice panel.
 * @returns {void}
 */
function openNotice() {
  drawerOpen.value = false;
  noticeOpen.value = true;
}

/**
 * Opens the responsive personalization panel.
 * @returns {void}
 */
function openPersonalization() {
  drawerOpen.value = false;
  personalizationOpen.value = true;
}

/**
 * Opens the language selector bottom sheet.
 * @returns {void}
 */
function openLanguage() {
  languageSheetOpen.value = true;
}

/**
 * openAssistantFromHeader 처리 함수입니다.
 * @returns {void}
 */
function openAssistantFromHeader() {
  assistantSheetOpen.value = true;
}

/**
 * selectAssistantFromSheet 처리 함수입니다.
 * @param {*} id 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function selectAssistantFromSheet(id) {
  startNewChatWithAssistant(id);
}

watch(
  () => [route.params.id, route.params.shareId, props.mode],
  () => {
    if (runtimeReady.value) loadRouteConversation();
  }
);

const runtimeReady = ref(false);

onMounted(async () => {
  updateMobileState();
  removeMobileMediaQueryListener = addMediaQueryListener(
    "(max-width: 900px)",
    updateMobileState
  );
  window.addEventListener("resize", updateMobileState, {passive: true});
  window.addEventListener("scroll", scheduleBottomStateCheck, true);
  await runtime.initialize();
  await loadRouteConversation();
  runtimeReady.value = true;
});

onBeforeUnmount(() => {
  window.clearTimeout(bottomStateTimer);
  removeMobileMediaQueryListener?.();
  window.removeEventListener("resize", updateMobileState);
  window.removeEventListener("scroll", scheduleBottomStateCheck, true);
  revokeMessageAttachments(messages.value);
});
</script>
