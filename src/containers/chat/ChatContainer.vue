<!--
@file ChatContainer.vue
@description Chat feature container that wires route state, runtime state and reusable chat layout components.
@author OpenAI
-->

<template>
  <ChatLayout
    :histories="histories"
    :assistants="assistants"
    :selected-assistant-id="selectedAssistantId"
    :active-history-id="activeHistoryId"
    :sidebar-collapsed="sidebarCollapsed"
    :drawer-open="drawerOpen"
    :collapsed-recent-open="collapsedRecentOpen"
    :keyboard-open="keyboardOpen"
    @update:selected-assistant-id="selectedAssistantId = $event"
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
  >
    <ChatWorkspace
      ref="workspaceRef"
      :mode="mode"
      :readonly="isReadOnly"
      :is-mobile="isMobile"
      :assistant-label="currentAssistant.label"
      :conversation-title="activeConversationTitle"
      :theme-name="themeName"
      :suggestions="suggestions"
      :selected-model="selectedModel"
      :models="models"
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
        scrollBottom({ force: true, behavior: 'smooth', stable: true })
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
  </ChatLayout>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAppContext } from "@/composables/useAppContext";
import { useAutoScroll } from "@/composables/useAutoScroll";
import { useChatRuntime } from "@/composables/useChatRuntime";
import { useChatSubmit } from "@/composables/useChatSubmit";
import { useImagePreview } from "@/composables/useImagePreview";
import { loadSharedConversation } from "@/composables/useSharedChat";
import { useViewportGuard } from "@/composables/useViewportGuard";
import { addMediaQueryListener } from "@/utils/dom";
import { renderMermaidInElement } from "@/utils/mermaidRenderer";
import ChatAssistantSheet from "@/components/chat/ChatAssistantSheet.vue";
import ChatImagePreview from "@/components/chat/ChatImagePreview.vue";
import ChatLayout from "@/components/chat/ChatLayout.vue";
import ChatWorkspace from "@/components/chat/ChatWorkspace.vue";
import LanguageSheet from "@/components/menu/LanguageSheet.vue";
import AppOverlayProvider from "@/components/overlay/AppOverlayProvider.vue";
import NoticeView from "@/views/settings/NoticeView.vue";
import PersonalizationView from "@/views/settings/PersonalizationView.vue";

const props = defineProps({ mode: { type: String, default: "main" } });

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const { theme } = useAppContext();
const runtime = useChatRuntime();
const {
  assistants,
  currentAssistant,
  histories,
  models,
  selectedAssistantId,
  selectedModel,
  ensureConversation,
  setConversation,
  getHistory,
  revokeMessageAttachments,
} = runtime;

const workspaceRef = ref(null);
const { scrollToBottom } = useAutoScroll({ value: null });
const { keyboardOpen, refreshViewport } = useViewportGuard({
  onChange: ({ isCompact, keyboardOpen: isKeyboardOpen }) => {
    if (isCompact && isKeyboardOpen) scrollBottom({ stable: true });
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
const {
  previewImage,
  closeImagePreview,
  handlePreviewLoad,
  handlePreviewError,
} = useImagePreview();
let removeMobileMediaQueryListener = null;
let bottomStateTimer = 0;
let forceBottomUntil = 0;

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

const suggestions = computed(() => [
  {
    icon: "▧",
    text: t("chat.suggestions.image"),
    prompt: "이미지 생성 화면의 UI 구조를 제안해줘",
  },
  {
    icon: "✎",
    text: t("chat.suggestions.writing"),
    prompt: "Vue Composition API 코드 리팩토링 기준을 정리해줘",
  },
  {
    icon: "◎",
    text: t("chat.suggestions.search"),
    prompt: "프로젝트에서 resolver에 추가할 항목을 알려줘",
  },
]);

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
    document.querySelector(".app-container--mobile, .app-shell--mobile"),
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
  if (shouldKeepForceBottom()) scrollBottom({ force: true, stable: true });
  scheduleBottomStateCheck();
}

/**
 * handlePromptFocus 처리 함수입니다.
 * @returns {void}
 */
function handlePromptFocus() {
  if (isReadOnly.value) return;
  refreshViewport();
  scrollBottom({ stable: true, force: isMobile.value });
}

/**
 * handlePromptResize 처리 함수입니다.
 * @returns {void}
 */
function handlePromptResize() {
  if (isReadOnly.value) return;
  scrollBottom({ stable: true, force: isMobile.value });
}

/**
 * startNewChat 처리 함수입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
async function startNewChat() {
  revokeMessageAttachments(messages.value);
  messages.value = [];
  drawerOpen.value = false;
  collapsedRecentOpen.value = false;
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
  await router.push({ name: "chat", params: { id: item.id } });
}

/**
 * loadRouteConversation 처리 함수입니다.
 * @returns {Promise<*>} 비동기 처리 결과를 반환합니다.
 */
async function loadRouteConversation() {
  if (props.mode === "main") {
    messages.value = [];
    return;
  }

  if (props.mode === "shared") {
    messages.value = await loadSharedConversation(activeHistoryId.value);
    markForceBottom();
    await nextTick();
    await scrollBottom({ behavior: "auto", force: true, stable: true });
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
  await scrollBottom({ behavior: "auto", force: true, stable: true });
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
  scrollBottom({ force: true, stable: true });
}

const { isGenerating, handleSubmit } = useChatSubmit({
  router,
  route,
  histories,
  messages,
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
  if (isReadOnly.value) return;
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
  scrollBottom({ stable: true });
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
  router.push({ name: "playground" });
}

/**
 * openSettings 처리 함수입니다.
 * @returns {void}
 */
function openSettings() {
  openPersonalization();
}

/**
 * Opens the guide page from desktop header or mobile service menu.
 * @returns {void}
 */
function openGuide() {
  drawerOpen.value = false;
  router.push({ name: "guide" });
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
  selectedAssistantId.value = id;
  assistantSheetOpen.value = false;
}

watch(
  () => [route.params.id, route.params.shareId, props.mode],
  loadRouteConversation,
  {
    immediate: true,
  },
);

onMounted(() => {
  updateMobileState();
  removeMobileMediaQueryListener = addMediaQueryListener(
    "(max-width: 900px)",
    updateMobileState,
  );
  window.addEventListener("resize", updateMobileState, { passive: true });
  window.addEventListener("scroll", scheduleBottomStateCheck, true);
});

onBeforeUnmount(() => {
  window.clearTimeout(bottomStateTimer);
  removeMobileMediaQueryListener?.();
  window.removeEventListener("resize", updateMobileState);
  window.removeEventListener("scroll", scheduleBottomStateCheck, true);
  revokeMessageAttachments(messages.value);
});
</script>
