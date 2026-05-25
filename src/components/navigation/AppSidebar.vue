<template>
  <aside
    class="desktop-sidebar"
    :class="{'desktop-sidebar--collapsed': sidebarCollapsed}"
  >
    <div
      v-if="!sidebarCollapsed"
      class="sidebar-content sidebar-content--assistant"
    >
      <div class="sidebar-top">
        <SidebarAssistantSelector
          ref="assistantSelectorRef"
          :assistants="assistants"
          :selected-assistant-id="selectedAssistantId"
          :open="assistantMenuOpen"
          @toggle="openAssistantSelector"
          @select="selectAssistant"
        />
        <div class="sidebar-top-actions">
          <button
            class="sidebar-round"
            type="button"
            :title="t('chat.hideSidebar')"
            :aria-label="t('chat.hideSidebar')"
            @click="navigationStore.setSidebarCollapsed(true)"
          >
            ☰
          </button>
        </div>
      </div>

      <nav class="quick-menu quick-menu--assistant">
        <button class="quick-item active" type="button" @click="handleNewChat">
          <Icon name="pencil" />{{ t("chat.newChat") }}
        </button>
        <button class="quick-item" type="button">
          <Icon name="search" />{{ t("chat.chatSearch") }}
        </button>
      </nav>

      <div class="section-label">{{ t("chat.conversations") }}</div>
      <SidebarHistoryList
        :histories="histories"
        :selected-chat-id="selectedChatId"
        @select="handleSelectHistory"
        @open-menu="openHistoryMenu"
      />
    </div>

    <CollapsedSidebar
      v-else
      :open="collapsedRecentOpen"
      :histories="histories"
      :selected-chat-id="selectedChatId"
      @expand="navigationStore.setSidebarCollapsed(false)"
      @new-chat="handleNewChat"
      @set-recent-open="navigationStore.setCollapsedRecentOpen"
      @select-history="handleSelectHistoryCollapsed"
    />
  </aside>

  <transition name="drawer-fade">
    <div
      v-if="drawerOpen"
      class="mobile-drawer-backdrop"
      @click="navigationStore.setDrawerOpen(false)"
    ></div>
  </transition>

  <transition name="drawer-slide">
    <aside v-if="drawerOpen" class="mobile-drawer">
      <div
        class="sidebar-content sidebar-content--mobile sidebar-content--assistant"
      >
        <div class="sidebar-top">
          <SidebarAssistantSelector
            :assistants="assistants"
            :selected-assistant-id="selectedAssistantId"
            mobile
            @toggle="openAssistantSelector"
          />
          <div class="sidebar-top-actions">
            <button
              class="sidebar-round"
              type="button"
              :title="t('common.close')"
              :aria-label="t('common.close')"
              @click="navigationStore.setDrawerOpen(false)"
            >
              ×
            </button>
          </div>
        </div>

        <nav class="quick-menu quick-menu--assistant quick-menu--mobile-search">
          <button
            class="quick-item active"
            type="button"
            @click="handleNewChat"
          >
            <Icon name="pencil" />{{ t("chat.newChat") }}
          </button>
          <button class="quick-item" type="button">
            <Icon name="search" />{{ t("chat.chatSearch") }}
          </button>
        </nav>

        <div class="section-label">{{ t("chat.conversations") }}</div>
        <SidebarHistoryList
          :histories="histories"
          :selected-chat-id="selectedChatId"
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
      class="bottom-sheet-option"
      :class="{active: assistant.id === selectedAssistantId}"
      type="button"
      @click="selectAssistant(assistant.id)"
    >
      <span class="bottom-sheet-option-main">
        <strong>{{ assistant.label }}</strong>
        <small>{{ assistant.description }}</small>
      </span>
      <span
        v-if="assistant.id === selectedAssistantId"
        class="bottom-sheet-selected-indicator"
        :aria-label="t('chat.assistantSelected')"
      >
        <CheckIcon class="bottom-sheet-check" />
        <span class="sr-only">{{ t("chat.assistantSelected") }}</span>
      </span>
    </button>
  </BaseBottomSheet>

  <ChatHistoryActionMenu
    ref="historyMenuRef"
    :open="historyMenuOpen"
    :is-mobile="isMobileSheet"
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

import {nextTick, ref, watch} from "vue";
import {storeToRefs} from "pinia";
import {useI18n} from "vue-i18n";
import {useEventListener} from "@vueuse/core";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import Icon from "@/components/navigation/SidebarIcon.vue";
import CollapsedSidebar from "@/components/navigation/parts/CollapsedSidebar.vue";
import SidebarAssistantSelector from "@/components/navigation/parts/SidebarAssistantSelector.vue";
import SidebarHistoryList from "@/components/navigation/parts/SidebarHistoryList.vue";
import ChatHistoryActionMenu from "@/components/navigation/parts/ChatHistoryActionMenu.vue";
import SidebarUserFooter from "@/components/navigation/parts/SidebarUserFooter.vue";
import {useAssistantStore} from "@/stores/assistantStore";
import {useRuntimeModeFlags} from "@/composables/app/useRuntimeModeFlags";
import {useChatStore} from "@/stores/chatStore";
import {useNavigationStore} from "@/stores/navigationStore";
import {useOutsideClick} from "@/composables/events/useOutsideClick";

const emit = defineEmits([
  "new-chat",
  "select-history",
  "history-menu-action",
  "select-assistant",
]);

const {t} = useI18n();
const assistantStore = useAssistantStore();
const chatStore = useChatStore();
const navigationStore = useNavigationStore();
const {isCompactViewport, shouldUseMobileLayout} = useRuntimeModeFlags();

const {assistants, selectedAssistantId} = storeToRefs(assistantStore);
const {histories, selectedChatId} = storeToRefs(chatStore);
const {sidebarCollapsed, drawerOpen, collapsedRecentOpen} =
  storeToRefs(navigationStore);
const assistantMenuOpen = ref(false);
const isMobileSheet = ref(false);
const assistantSelectorRef = ref(null);
const historyMenuRef = ref(null);
const historyMenuOpen = ref(false);
const historyMenuTarget = ref(null);
const historyMenuReferenceEl = ref(null);
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
  syncViewportMode();
  assistantMenuOpen.value = !assistantMenuOpen.value;
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function selectAssistant(id) {
  emit("select-assistant", id);
  assistantMenuOpen.value = false;
}

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
function handleNewChat() {
  emit("new-chat");
  navigationStore.setDrawerOpen(false);
  navigationStore.setCollapsedRecentOpen(false);
}

/**
 * 관련 modal, sheet, menu, overlay 상태를 열림 상태로 전환합니다.
 */
function openHistoryMenu(payload = {}) {
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
  const history = historyMenuTarget.value;
  historyMenuOpen.value = false;
  if (!history || !action) return;
  emit("history-menu-action", {action, history});
}

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
function handleSelectHistory(item) {
  emit("select-history", item);
  navigationStore.setDrawerOpen(false);
}

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
function handleSelectHistoryCollapsed(item) {
  emit("select-history", item);
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

<style scoped>
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
