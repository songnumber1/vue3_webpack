<template>
  <aside
    class="desktop-sidebar tw-flex tw-h-full tw-shrink-0 tw-flex-col tw-border-r tw-border-app-sidebarBorder tw-bg-app-sidebar tw-text-app-sidebarText"
    :class="{'desktop-sidebar--collapsed': sidebarCollapsed}"
  >
    <div
      v-if="!sidebarCollapsed"
      class="sidebar-content sidebar-content--assistant tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-3"
    >
      <div
        class="sidebar-top tw-flex tw-items-center tw-justify-between tw-gap-2"
      >
        <SidebarAssistantSelector
          ref="assistantSelectorRef"
          :assistants="visibleAssistants"
          :selected-assistant-id="selectedAssistantId"
          :open="assistantMenuOpen"
          @toggle="openAssistantSelector"
          @select="selectAssistant"
        />
        <div class="sidebar-top-actions tw-flex tw-items-center tw-gap-2">
          <button
            class="sidebar-round tw-inline-flex tw-items-center tw-justify-center tw-rounded-control tw-border tw-border-app-sidebarBorder tw-bg-app-control tw-text-app-sidebarIcon tw-transition"
            type="button"
            :title="t('chat.hideSidebar')"
            :aria-label="t('chat.hideSidebar')"
            @click="navigationStore.setSidebarCollapsed(true)"
          >
            ☰
          </button>
        </div>
      </div>

      <nav
        class="quick-menu quick-menu--assistant tw-flex tw-flex-col tw-gap-1"
      >
        <button
          class="quick-item active tw-flex tw-w-full tw-items-center tw-gap-2 tw-rounded-control tw-text-left tw-transition"
          type="button"
          @click="handleNewChat"
        >
          <Icon name="pencil" />{{ t("chat.newChat") }}
        </button>
        <button
          class="quick-item tw-flex tw-w-full tw-items-center tw-gap-2 tw-rounded-control tw-text-left tw-transition"
          :class="{active: route.name === ROUTE_NAMES.CHAT_SEARCH}"
          type="button"
          @click="handleChatSearch"
        >
          <Icon name="search" />{{ t("chat.chatSearch") }}
        </button>
      </nav>

      <div
        class="section-label tw-px-2 tw-text-xs tw-font-semibold tw-text-app-sidebarSection"
      >
        {{ t("chat.conversations") }}
      </div>
      <SidebarHistoryListDesktop
        :histories="histories"
        :selected-chat-id="effectiveSelectedChatId"
        use-overlay-scrollbar
        @select="handleSelectHistory"
        @open-menu="openHistoryMenu"
      />
    </div>

    <CollapsedSidebar
      v-else
      :open="collapsedRecentOpen"
      :histories="histories"
      :selected-chat-id="effectiveSelectedChatId"
      @expand="navigationStore.setSidebarCollapsed(false)"
      @new-chat="handleNewChat"
      @set-recent-open="navigationStore.setCollapsedRecentOpen"
      @chat-search="handleChatSearch"
      @select-history="handleSelectHistoryCollapsed"
    />
  </aside>

  <transition name="drawer-fade">
    <div
      v-if="drawerOpen"
      class="mobile-drawer-backdrop tw-fixed tw-inset-0 tw-bg-app-drawerOverlay"
      @click="closeNavigationDrawer"
    ></div>
  </transition>

  <transition name="drawer-slide">
    <aside
      v-if="drawerOpen"
      class="mobile-drawer tw-fixed tw-inset-y-0 tw-left-0 tw-z-drawer tw-flex tw-h-full tw-w-mobileDrawer tw-flex-col tw-bg-app-sidebar"
    >
      <div
        class="sidebar-content sidebar-content--mobile sidebar-content--assistant tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-3"
      >
        <div
          class="sidebar-top tw-flex tw-items-center tw-justify-between tw-gap-2"
        >
          <SidebarAssistantSelector
            :assistants="visibleAssistants"
            :selected-assistant-id="selectedAssistantId"
            mobile
            @toggle="openAssistantSelector"
          />
          <div class="sidebar-top-actions tw-flex tw-items-center tw-gap-2">
            <button
              class="sidebar-round tw-inline-flex tw-items-center tw-justify-center tw-rounded-control tw-border tw-border-app-sidebarBorder tw-bg-app-control tw-text-app-sidebarIcon tw-transition"
              type="button"
              :title="t('common.close')"
              :aria-label="t('common.close')"
              @click="closeNavigationDrawer"
            >
              ×
            </button>
          </div>
        </div>

        <nav
          class="quick-menu quick-menu--assistant quick-menu--mobile-search tw-flex tw-flex-col tw-gap-1"
        >
          <button
            class="quick-item active tw-flex tw-w-full tw-items-center tw-gap-2 tw-rounded-control tw-text-left tw-transition"
            type="button"
            @click="handleNewChat"
          >
            <Icon name="pencil" />{{ t("chat.newChat") }}
          </button>
          <button
            class="quick-item tw-flex tw-w-full tw-items-center tw-gap-2 tw-rounded-control tw-text-left tw-transition"
            :class="{active: route.name === ROUTE_NAMES.CHAT_SEARCH}"
            type="button"
            @click="handleChatSearch"
          >
            <Icon name="search" />{{ t("chat.chatSearch") }}
          </button>
        </nav>

        <div
          class="section-label tw-px-2 tw-text-xs tw-font-semibold tw-text-app-sidebarSection"
        >
          {{ t("chat.conversations") }}
        </div>
        <SidebarHistoryListMobile
          :histories="histories"
          :selected-chat-id="effectiveSelectedChatId"
          use-overlay-scrollbar
          @select="handleSelectHistory"
          @open-menu="openHistoryMenu"
        />

        <SidebarUserFooter />
      </div>
    </aside>
  </transition>

  <AssistantBottomSheet
    :open="assistantMenuOpen && isMobileSheet"
    :assistants="visibleAssistants"
    :selected-assistant-id="selectedAssistantId"
    @close="assistantMenuOpen = false"
    @select="selectAssistant"
  />

  <ChatHistoryActionBottomSheet
    :open="historyMenuOpen && isMobileSheet"
    :target="historyMenuTarget"
    @close="closeHistoryMenu"
    @select="selectHistoryMenuAction"
  />

  <ChatHistoryActionFloatMenu
    ref="historyMenuRef"
    :open="historyMenuOpen && !isMobileSheet"
    :target="historyMenuTarget"
    :reference-el="historyMenuReferenceEl"
    @select="selectHistoryMenuAction"
  />
</template>

<script setup>
/**
 * @file components/navigation/AppSidebar.vue
 * @description 좌측 메뉴/드로어 관련 UI입니다. navigation store 상태와 사용자 메뉴 action을 화면에 연결합니다.
 */

import {computed, nextTick, ref, watch} from "vue";
import {storeToRefs} from "pinia";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useEventListener} from "@vueuse/core";
import Icon from "@/components/navigation/NavigationIcon.vue";
import CollapsedSidebar from "@/components/navigation/controls/CollapsedSidebar.vue";
import SidebarAssistantSelector from "@/components/navigation/controls/SidebarAssistantSelector.vue";
import SidebarHistoryListDesktop from "@/components/navigation/history/SidebarHistoryListDesktop.vue";
import SidebarHistoryListMobile from "@/components/navigation/history/SidebarHistoryListMobile.vue";
import AssistantBottomSheet from "@/components/assistant/select/AssistantBottomSheet.vue";
import ChatHistoryActionBottomSheet from "@/components/navigation/history/ChatHistoryActionBottomSheet.vue";
import ChatHistoryActionFloatMenu from "@/components/navigation/history/ChatHistoryActionFloatMenu.vue";
import SidebarUserFooter from "@/components/navigation/controls/SidebarUserFooter.vue";
import {useAssistantStore} from "@/stores/assistantStore";
import {useRuntimeModeFlags} from "@/composables/app/useRuntimeModeFlags";
import {useChatStore} from "@/stores/chatStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useNavigationStore} from "@/stores/navigationStore";
import {useStudioRuntimeStore} from "@/stores/studioRuntimeStore";
import {useOutsideClick} from "@/composables/events/useOutsideClick";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";
import {isPortalAssistantId} from "@/constants/assistantPortal";
import {loadExamplePrompts} from "@/composables/chat/runtime/chatRuntimeApi";
import {navigateToConversation} from "@/actions/chat/conversationRouteActions";
import {
  clearConversationNavigationState as clearConversationNavigationStateByPolicy,
  navigateToMainAfterConversationReset,
  resetConversationStateForRouteChange as resetConversationStateForRouteChangeByPolicy,
  preparePortalConversationNavigation,
  cleanupAfterPortalConversationNavigation,
} from "@/composables/chat/internal/navigation/chatNavigationReset";
import {createPortalAssistantRoute} from "@/composables/chat/internal/navigation/portalAssistantRoutePolicy";
import {logWarn} from "@/utils/logger";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {resolveBlocked} from "@/utils/interactionGuard";
import {
  closeNavigationDrawer,
  closeNavigationDrawerAndCollapsedRecent,
  closeNavigationDrawerAndTransientPanels,
} from "@/actions/navigation/navigationUiActions";
const route = useRoute();
const router = useRouter();
const {t} = useI18n();
const assistantStore = useAssistantStore();
const chatStore = useChatStore();
const chatStreamStore = useChatStreamStore();
const navigationStore = useNavigationStore();
const studioRuntimeStore = useStudioRuntimeStore();
const emit = defineEmits(["history-menu-action"]);
const {isCompactViewport, shouldUseMobileLayout} = useRuntimeModeFlags();
const {
  NAVIGATION_LOCK_SCOPES,
  acquireLockIfFree,
  releaseLock,
  isGlobalLocked,
  isStreamingLocked,
  isChatHistoryLocked,
} = useNavigationLock();

const {assistants, selectedAssistantId} = storeToRefs(assistantStore);
const {histories, pendingSelectedChatId, selectedChatId} =
  storeToRefs(chatStore);
const {sidebarCollapsed, drawerOpen, collapsedRecentOpen} =
  storeToRefs(navigationStore);

function isDeletedRuntimeStudio(assistant = null) {
  const id = String(assistant?.id || "").trim();
  if (!id) return false;
  const isStudio =
    assistant?.type === "studio" ||
    assistant?.isStudio === true ||
    assistant?.studio === true;
  return Boolean(isStudio && studioRuntimeStore.isStudioDeleted(id));
}

async function preloadRuntimeExamplePrompts(assistantId) {
  if (!assistantId || assistantStore.examplePromptMap[assistantId]) return;
  try {
    const assistant = assistantStore.assistantMap[assistantId];
    const prompts = await loadExamplePrompts({
      assistantId,
      studioYN: assistant?.type === "studio",
    });
    assistantStore.setExamplePrompts(assistantId, prompts);
  } catch (error) {
    logWarn("[AppSidebar] preloadExamplePrompts 오류:", error);
  }
}

async function selectRuntimeAssistant(id, {forNewChat = false} = {}) {
  if (!forNewChat && chatStore.isModelLocked) return;
  if (!assistantStore.assistantMap[id]) return;
  try {
    await preloadRuntimeExamplePrompts(id);
    assistantStore.selectAssistant(id);
    if (forNewChat) chatStore.clearActiveSession();
  } catch (error) {
    logWarn("[AppSidebar] selectAssistant 오류:", error);
  }
}

const visibleAssistants = computed(() =>
  assistants.value.filter((assistant) => !isDeletedRuntimeStudio(assistant))
);
const assistantMenuOpen = ref(false);
const isMobileSheet = ref(false);
const assistantSelectorRef = ref(null);
const historyMenuRef = ref(null);
const historyMenuOpen = ref(false);
const historyMenuTarget = ref(null);
const historyMenuReferenceEl = ref(null);
const effectiveSelectedChatId = computed(
  () => pendingSelectedChatId.value || selectedChatId.value
);
const isStreamingBlocked = computed(
  () => chatStreamStore.isStreaming || isStreamingLocked.value
);
const isChatHistoryBlocked = computed(() => isChatHistoryLocked.value);
const isSidebarActionBlocked = computed(
  () =>
    isGlobalLocked.value ||
    isStreamingBlocked.value ||
    isChatHistoryBlocked.value
);
const sidebarLock = {
  isSidebarActionBlocked,
  isHistorySelectBlocked: computed(() => isSidebarActionBlocked.value),
  isHistoryMenuBlocked: computed(() => isSidebarActionBlocked.value),
  isNewChatBlocked: computed(() => isSidebarActionBlocked.value),
  isAssistantSelectBlocked: computed(() => isSidebarActionBlocked.value),
  isChatSearchBlocked: computed(() => isSidebarActionBlocked.value),
};
const {
  isChatSearchBlocked,
  isHistoryMenuBlocked,
  isHistorySelectBlocked,
  isNewChatBlocked,
} = sidebarLock;
function syncViewportMode() {
  isMobileSheet.value = shouldUseMobileLayout.value;
}

function getHistoryId(item) {
  return String(item?.id || "").trim();
}

function closeSidebarNavigationPanels() {
  closeNavigationDrawerAndCollapsedRecent();
}

function closeAssistantSelector() {
  assistantMenuOpen.value = false;
}

function clearConversationNavigationState() {
  clearConversationNavigationStateByPolicy();
}

function preparePortalNavigation() {
  preparePortalConversationNavigation();
  closeAssistantSelector();
}

function cleanupAfterPortalNavigation() {
  cleanupAfterPortalConversationNavigation();
}

async function navigatePortalAssistant(assistantId) {
  const targetRoute = createPortalAssistantRoute(assistantId);

  preparePortalNavigation();
  assistantStore.selectAssistant(assistantId);
  await router.push(targetRoute).catch(() => {});
  cleanupAfterPortalNavigation();
}

async function navigateMainAfterReset() {
  await navigateToMainAfterConversationReset({
    router,
    clearBeforeNavigate: clearConversationNavigationState,
  });
}

function resetConversationStateForRouteChange() {
  resetConversationStateForRouteChangeByPolicy();
  closeAssistantSelector();
}

async function resetChatState({assistantId = null} = {}) {
  resetConversationStateForRouteChange();

  if (assistantId) {
    try {
      await selectRuntimeAssistant(assistantId, {forNewChat: true});
    } catch (error) {
      logWarn("[AppSidebar] selectAssistant 오류:", error);
    }
  }

  await navigateMainAfterReset();
}

/**
 * 관련 modal, sheet, menu, overlay 상태를 열림 상태로 전환합니다.
 */
function openAssistantSelector() {
  if (resolveBlocked(sidebarLock.isAssistantSelectBlocked)) return;
  syncViewportMode();
  assistantMenuOpen.value = !assistantMenuOpen.value;
}

async function selectAssistant(id) {
  if (isPortalAssistantId(id)) {
    if (isGlobalLocked.value || isStreamingLocked.value) return;
    await navigatePortalAssistant(id);
    return;
  }

  if (resolveBlocked(sidebarLock.isAssistantSelectBlocked)) return;

  await resetChatState({assistantId: id});

  if ([ROUTE_NAMES.STUDIO, ROUTE_NAMES.CONNECTOR_STORE].includes(route.name)) {
    await router.push({name: ROUTE_NAMES.MAIN}).catch(() => {});
  }
}

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
async function handleNewChat() {
  if (isNewChatBlocked.value) return;
  await resetChatState();
}

function handleChatSearch() {
  if (isChatSearchBlocked.value) return;
  closeSidebarNavigationPanels();
  router.push({name: ROUTE_NAMES.CHAT_SEARCH}).catch(() => {});
}

/**
 * 관련 modal, sheet, menu, overlay 상태를 열림 상태로 전환합니다.
 */
function openHistoryMenu(payload = {}) {
  if (isHistoryMenuBlocked.value) return;
  syncViewportMode();
  const {item, event} = payload;
  historyMenuTarget.value = item || null;
  historyMenuReferenceEl.value = event?.currentTarget || null;
  historyMenuOpen.value = true;
}

/**
 * 관련 modal, sheet, menu, overlay 상태를 닫힘 상태로 전환합니다.
 */
function closeHistoryMenu() {
  historyMenuOpen.value = false;
  historyMenuTarget.value = null;
  historyMenuReferenceEl.value = null;
}

function selectHistoryMenuAction(action) {
  if (isHistoryMenuBlocked.value) return;
  const history = historyMenuTarget.value;
  historyMenuOpen.value = false;
  if (!history || !action) return;
  emit("history-menu-action", {action, history});
}

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
async function handleSelectHistory(item) {
  if (isHistorySelectBlocked.value) return;
  await selectHistory(item);
}

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
async function handleSelectHistoryCollapsed(item) {
  if (isHistorySelectBlocked.value) return;
  await selectHistory(item, {
    source: "collapsed-sidebar",
    closeCollapsedRecent: true,
  });
}

async function selectHistory(item, options = {}) {
  if (resolveBlocked(sidebarLock.isHistorySelectBlocked)) return false;

  const historyId = getHistoryId(item);
  if (!historyId) return false;

  const currentHistoryId = String(
    chatStore.pendingSelectedChatId ||
      chatStore.activeRoomId ||
      chatStore.selectedChatId ||
      ""
  ).trim();
  if (currentHistoryId && currentHistoryId === historyId) {
    return false;
  }

  const lockEntry = acquireLockIfFree(NAVIGATION_LOCK_SCOPES.chatHistory, {
    owner: historyId,
    reason: "sidebar-history-select",
    meta: {source: options.source || "sidebar"},
  });

  if (!lockEntry) return false;

  try {
    chatStore.setPendingSelectedChatId(historyId);
    closeNavigationDrawerAndTransientPanels();
    navigationStore.setCollapsedRecentOpen(false);

    await navigateToConversation({
      router,
      chatId: historyId,
    }).catch(() => {});

    if (options.closeCollapsedRecent) {
      navigationStore.setCollapsedRecentOpen(false);
    } else {
      closeNavigationDrawer();
    }

    await nextTick();
    return true;
  } catch (_error) {
    releaseLock(NAVIGATION_LOCK_SCOPES.chatHistory, historyId);
    chatStore.clearPendingSelectedChatId();
    return false;
  }
}

useOutsideClick(
  () =>
    assistantSelectorRef.value?.rootRef?.value ||
    assistantSelectorRef.value?.rootRef,
  () => {
    assistantMenuOpen.value = false;
  },
  {shouldIgnore: () => isMobileSheet.value}
);

useOutsideClick(
  () => historyMenuRef.value?.menuRef?.value || historyMenuRef.value?.menuRef,
  closeHistoryMenu,
  {shouldIgnore: () => isMobileSheet.value || !historyMenuOpen.value}
);

syncViewportMode();

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
async function handleViewportModeChange(isCompact) {
  syncViewportMode();
  if (isCompact) return;

  // PC 브라우저에서 모바일 폭으로 열려 있던 drawer가 웹 폭으로 전환될 때
  // 전역 .mobile-drawer fallback CSS가 남아 보이지 않도록 즉시 상태를 닫는다.
  closeNavigationDrawer();
  assistantMenuOpen.value = false;
  closeHistoryMenu();
  await nextTick();
  syncViewportMode();
}

watch(isCompactViewport, handleViewportModeChange, {flush: "post"});
useEventListener(
  window,
  "resize",
  () => {
    syncViewportMode();
    if (!isCompactViewport.value && drawerOpen.value) {
      closeNavigationDrawer();
    }
  },
  {passive: true}
);
</script>

<style scoped lang="scss">
/*
 * AppSidebar local guard styles.
 * Shared mobile drawer/browser fallback rules stay in global CSS because they
 * intentionally target teleported/viewport-level states.
 */
.desktop-sidebar {
  min-width: 0;
}

.sidebar-content--assistant {
  min-width: 0;
}

.sidebar-top {
  min-width: 0;
}

.quick-menu--assistant {
  min-width: 0;
}

.mobile-drawer {
  box-sizing: border-box;
}

.mobile-drawer .sidebar-content--assistant {
  min-width: 0;
}

.bottom-sheet-option-main {
  min-width: 0;
}
</style>
