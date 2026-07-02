<template>
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
    :open="assistantMenuOpen"
    :assistants="visibleAssistants"
    :selected-assistant-id="selectedAssistantId"
    @close="assistantMenuOpen = false"
    @select="selectAssistant"
  />

  <ChatHistoryActionBottomSheet
    :open="historyMenuOpen"
    :target="historyMenuTarget"
    @close="closeHistoryMenu"
    @select="selectHistoryMenuAction"
  />
</template>

<script setup>
/**
 * @file components/navigation/AppSidebar.vue
 * @description 모바일 전용 navigation drawer입니다.
 */

import {computed, nextTick, ref} from "vue";
import {storeToRefs} from "pinia";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import Icon from "@/components/navigation/NavigationIcon.vue";
import SidebarAssistantSelector from "@/components/navigation/controls/SidebarAssistantSelector.vue";
import SidebarHistoryListMobile from "@/components/navigation/history/SidebarHistoryListMobile.vue";
import AssistantBottomSheet from "@/components/assistant/select/AssistantBottomSheet.vue";
import ChatHistoryActionBottomSheet from "@/components/navigation/history/ChatHistoryActionBottomSheet.vue";
import SidebarUserFooter from "@/components/navigation/controls/SidebarUserFooter.vue";
import {useChatStore} from "@/stores/chatStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useStudioRuntimeStore} from "@/stores/studioRuntimeStore";
import {useAppShellStore} from "@/stores/appShellStore";
import {isPortalAssistantId} from "@/constants/assistantPortal";
import {loadExamplePrompts} from "@/composables/chat/runtime/chatRuntimeApi";
import {
  cleanupAfterPortalConversationNavigation,
  clearConversationNavigationState as clearConversationNavigationStateByPolicy,
  createPortalAssistantRoute,
  enterChatRoom,
  navigateToMainAfterConversationReset,
  preparePortalConversationNavigation,
  resetConversationStateForRouteChange as resetConversationStateForRouteChangeByPolicy,
} from "@/composables/chat/chatRoomActions";
import {logWarn} from "@/utils/logger";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {resolveBlocked} from "@/utils/interactionGuard";
import {useNavigationActions} from "@/composables/navigation/context/navigationActionContext";

const route = useRoute();
const router = useRouter();
const {t} = useI18n();
const navigationActions = useNavigationActions();
const chatStore = useChatStore();
const chatStreamStore = useChatStreamStore();
const appShellStore = useAppShellStore();
const studioRuntimeStore = useStudioRuntimeStore();
const {assistants, selectedAssistantId} = storeToRefs(chatStore);
const {histories, pendingSelectedChatId, selectedChatId} =
  storeToRefs(chatStore);
const {drawerOpen} = storeToRefs(appShellStore);

const assistantMenuOpen = ref(false);
const historyMenuOpen = ref(false);
const historyMenuTarget = ref(null);
const effectiveSelectedChatId = computed(
  () => pendingSelectedChatId.value || selectedChatId.value
);
const isSidebarActionBlocked = computed(() => chatStreamStore.isWait);
const sidebarLock = {
  isHistorySelectBlocked: isSidebarActionBlocked,
  isHistoryMenuBlocked: isSidebarActionBlocked,
  isNewChatBlocked: isSidebarActionBlocked,
  isAssistantSelectBlocked: isSidebarActionBlocked,
  isChatSearchBlocked: isSidebarActionBlocked,
};

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
  if (!assistantId || chatStore.examplePromptMap[assistantId]) return;
  try {
    const assistant = chatStore.assistantMap[assistantId];
    const prompts = await loadExamplePrompts(
      assistantId,
      assistant?.type === "studio"
    );
    chatStore.setExamplePrompts(assistantId, prompts);
  } catch (error) {
    logWarn("[AppSidebar] preloadExamplePrompts 오류:", error);
  }
}

async function selectRuntimeAssistant(id, {forNewChat = false} = {}) {
  if (!forNewChat && chatStore.isModelLocked) return;
  if (!chatStore.assistantMap[id]) return;
  try {
    await preloadRuntimeExamplePrompts(id);
    chatStore.selectAssistant(id);
    if (forNewChat) chatStore.clearActiveSession();
  } catch (error) {
    logWarn("[AppSidebar] selectAssistant 오류:", error);
  }
}

const visibleAssistants = computed(() =>
  assistants.value.filter((assistant) => !isDeletedRuntimeStudio(assistant))
);

function getHistoryId(item) {
  return String(item?.id || "").trim();
}

function closeSidebarNavigationPanels() {
  appShellStore.closeTransientShellPanels();
}

function closeNavigationDrawer() {
  appShellStore.setDrawerOpen(false);
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
  chatStore.selectAssistant(assistantId);
  await router.push(targetRoute).catch(() => {});
  cleanupAfterPortalNavigation();
}

async function navigateMainAfterReset() {
  await navigateToMainAfterConversationReset(
    router,
    clearConversationNavigationState
  );
}

function resetConversationStateForRouteChange() {
  resetConversationStateForRouteChangeByPolicy();
  closeAssistantSelector();
}

async function resetChatState({assistantId = null} = {}) {
  resetConversationStateForRouteChange();

  if (assistantId) {
    await selectRuntimeAssistant(assistantId, {forNewChat: true});
  }

  await navigateMainAfterReset();
}

function openAssistantSelector() {
  if (resolveBlocked(sidebarLock.isAssistantSelectBlocked)) return;
  assistantMenuOpen.value = true;
}

async function selectAssistant(id) {
  if (isPortalAssistantId(id)) {
    if (chatStreamStore.isWait) return;
    await navigatePortalAssistant(id);
    return;
  }

  if (resolveBlocked(sidebarLock.isAssistantSelectBlocked)) return;

  await resetChatState({assistantId: id});

  if ([ROUTE_NAMES.STUDIO, ROUTE_NAMES.CONNECTOR_STORE].includes(route.name)) {
    await router.push({name: ROUTE_NAMES.MAIN}).catch(() => {});
  }
}

async function handleNewChat() {
  if (resolveBlocked(sidebarLock.isNewChatBlocked)) return;
  await resetChatState();
}

function handleChatSearch() {
  if (resolveBlocked(sidebarLock.isChatSearchBlocked)) return;
  closeSidebarNavigationPanels();
  router.push({name: ROUTE_NAMES.CHAT_SEARCH}).catch(() => {});
}

function openHistoryMenu(payload = {}) {
  if (resolveBlocked(sidebarLock.isHistoryMenuBlocked)) return;
  historyMenuTarget.value = payload.item || null;
  historyMenuOpen.value = true;
}

function closeHistoryMenu() {
  historyMenuOpen.value = false;
  historyMenuTarget.value = null;
}

function selectHistoryMenuAction(action) {
  if (resolveBlocked(sidebarLock.isHistoryMenuBlocked)) return;
  const history = historyMenuTarget.value;
  closeHistoryMenu();
  if (!history || !action) return;
  navigationActions.handleHistoryMenuAction?.({action, history});
}

async function handleSelectHistory(item) {
  if (resolveBlocked(sidebarLock.isHistorySelectBlocked)) return;
  await selectHistory(item);
}

async function selectHistory(item) {
  if (resolveBlocked(sidebarLock.isHistorySelectBlocked)) return false;

  const historyId = getHistoryId(item);
  if (!historyId) return false;

  const currentHistoryId = String(chatStore.selectedChatId || "").trim();
  if (
    route.name === ROUTE_NAMES.CHAT_ENTRY &&
    currentHistoryId === historyId
  ) {
    return false;
  }

  try {
    appShellStore.closeTransientShellPanels();
    appShellStore.setDrawerOpen(false);
    await nextTick();
    return await enterChatRoom(router, historyId);
  } catch (_error) {
    return false;
  }
}
</script>

<style scoped lang="scss">
.sidebar-content--assistant,
.sidebar-top,
.quick-menu--assistant,
.bottom-sheet-option-main {
  min-width: 0;
}

.mobile-drawer {
  box-sizing: border-box;
}

.mobile-drawer .sidebar-content--assistant {
  min-width: 0;
}
</style>
