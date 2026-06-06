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
          :assistants="assistants"
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
          :class="{active: route.name === 'chat-search'}"
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
      <SidebarHistoryList
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
      @click="navigationStore.setDrawerOpen(false)"
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
            :assistants="assistants"
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
              @click="navigationStore.setDrawerOpen(false)"
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
            :class="{active: route.name === 'chat-search'}"
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
        <SidebarHistoryList
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

  <BaseBottomSheet
    :open="assistantMenuOpen && isMobileSheet"
    :title="t('chat.assistantSelect')"
    @close="assistantMenuOpen = false"
  >
    <button
      v-for="assistant in assistants"
      :key="assistant.id"
      class="bottom-sheet-option tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-text-left"
      :class="{active: assistant.id === selectedAssistantId}"
      type="button"
      @click="selectAssistant(assistant.id)"
    >
      <span
        class="bottom-sheet-option-main tw-flex tw-min-w-0 tw-flex-col tw-gap-1"
      >
        <strong>{{ assistant.label }}</strong>
        <small>{{ assistant.description }}</small>
      </span>
      <span
        v-if="assistant.id === selectedAssistantId"
        class="bottom-sheet-selected-indicator tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center"
        :aria-label="t('chat.assistantSelected')"
      >
        <CheckIcon class="bottom-sheet-check" />
        <span class="sr-only">{{ t("chat.assistantSelected") }}</span>
      </span>
    </button>
  </BaseBottomSheet>

  <ChatHistoryContextMenu
    ref="historyMenuRef"
    :open="historyMenuOpen"
    :target="historyMenuTarget"
    :reference-el="historyMenuReferenceEl"
    @close="closeHistoryMenu"
    @select="selectHistoryMenuAction"
  />
</template>

<script setup>
/**
 * @file components/navigation/AppSidebar.vue
 * @description 좌측 메뉴/드로어 관련 UI입니다. navigation store 상태와 사용자 메뉴 action을 화면에 연결합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, inject, nextTick, ref, watch} from "vue";
import {storeToRefs} from "pinia";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {useEventListener} from "@vueuse/core";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import Icon from "@/components/navigation/NavigationIcon.vue";
import CollapsedSidebar from "@/components/navigation/controls/CollapsedSidebar.vue";
import SidebarAssistantSelector from "@/components/navigation/controls/SidebarAssistantSelector.vue";
import SidebarHistoryList from "@/components/navigation/controls/SidebarHistoryList.vue";
import ChatHistoryContextMenu from "@/components/navigation/controls/ChatHistoryContextMenu.vue";
import SidebarUserFooter from "@/components/navigation/controls/SidebarUserFooter.vue";
import {useAssistantStore} from "@/stores/assistantStore";
import {useRuntimeModeFlags} from "@/composables/app/useRuntimeModeFlags";
import {useChatStore} from "@/stores/chatStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useNavigationStore} from "@/stores/navigationStore";
import {useOutsideClick} from "@/composables/events/useOutsideClick";
import {
  CHAT_ACTIONS_KEY,
  createEmptyChatActions,
} from "@/composables/chat/chatActionContext";

const chatActions = inject(CHAT_ACTIONS_KEY, createEmptyChatActions());

const router = useRouter();
const route = useRoute();
const ASSISTANT_STUDIO_PORTAL_ID = "assistant-studio";
const CONNECTOR_STORE_PORTAL_ID = "connector-store";
const {t} = useI18n();
const assistantStore = useAssistantStore();
const chatStore = useChatStore();
const chatStreamStore = useChatStreamStore();
const navigationStore = useNavigationStore();
const {isCompactViewport, shouldUseMobileLayout} = useRuntimeModeFlags();

const {assistants, selectedAssistantId} = storeToRefs(assistantStore);
const {histories, pendingSelectedChatId, selectedChatId} =
  storeToRefs(chatStore);
const {sidebarCollapsed, drawerOpen, collapsedRecentOpen} =
  storeToRefs(navigationStore);
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
const isSidebarNavigationLocked = computed(
  () => chatStreamStore.isStreaming || chatStore.isNavigationLocked
);
const isStreamingNavigationLocked = computed(() => chatStreamStore.isStreaming);
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function syncViewportMode() {
  isMobileSheet.value = shouldUseMobileLayout.value;
}

/**
 * 관련 modal, sheet, menu, overlay 상태를 열림 상태로 전환합니다.
 */
function openAssistantSelector() {
  if (isStreamingNavigationLocked.value) return;
  syncViewportMode();
  assistantMenuOpen.value = !assistantMenuOpen.value;
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
async function selectAssistant(id) {
  if (isStreamingNavigationLocked.value) return;
  const isStudioPortal = id === ASSISTANT_STUDIO_PORTAL_ID;
  const isConnectorPortal = id === CONNECTOR_STORE_PORTAL_ID;

  if (isStudioPortal || isConnectorPortal) {
    assistantStore.selectAssistant(id);
    assistantMenuOpen.value = false;
    navigationStore.setDrawerOpen(false);
    router
      .push({name: isConnectorPortal ? "connector-store" : "studio"})
      .catch(() => {});
    return;
  }

  await chatActions.selectAssistant(id);
  assistantMenuOpen.value = false;

  if (["studio", "connector-store"].includes(route.name)) {
    router.push({name: "main"}).catch(() => {});
  }
}

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
async function handleNewChat() {
  if (isStreamingNavigationLocked.value) return;
  await chatActions.newChat();
  navigationStore.setDrawerOpen(false);
  navigationStore.setCollapsedRecentOpen(false);
}

function handleChatSearch() {
  if (isSidebarNavigationLocked.value) return;
  navigationStore.setDrawerOpen(false);
  navigationStore.setCollapsedRecentOpen(false);
  router.push({name: "chat-search"}).catch(() => {});
}

/**
 * 관련 modal, sheet, menu, overlay 상태를 열림 상태로 전환합니다.
 */
function openHistoryMenu(payload = {}) {
  if (isSidebarNavigationLocked.value) return;
  const {item, event} = payload;
  syncViewportMode();
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

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function selectHistoryMenuAction(action) {
  if (isSidebarNavigationLocked.value) return;
  const history = historyMenuTarget.value;
  historyMenuOpen.value = false;
  if (!history || !action) return;
  chatActions.historyMenuAction({action, history});
}

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
async function handleSelectHistory(item) {
  if (isSidebarNavigationLocked.value) return;
  const moved = await chatActions.selectHistory(item);
  if (moved === false) return;
  navigationStore.setDrawerOpen(false);
}

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
async function handleSelectHistoryCollapsed(item) {
  if (isSidebarNavigationLocked.value) return;
  const moved = await chatActions.selectHistory(item);
  if (moved === false) return;
  navigationStore.setCollapsedRecentOpen(false);
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
  navigationStore.setDrawerOpen(false);
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
      navigationStore.setDrawerOpen(false);
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
