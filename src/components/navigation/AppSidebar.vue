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
            @click="setSidebarCollapsed(true)"
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
      @expand="setSidebarCollapsed(false)"
      @new-chat="handleNewChat"
      @set-recent-open="setCollapsedRecentOpen"
      @select-history="handleSelectHistoryCollapsed"
    />
  </aside>

  <transition name="drawer-fade">
    <div
      v-if="drawerOpen"
      class="mobile-drawer-backdrop"
      @click="setDrawerOpen(false)"
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
              @click="setDrawerOpen(false)"
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
import {useRuntimeModeFlags} from "@/composables/useRuntimeModeFlags";
import {useChatStore} from "@/stores/chatStore";
import {useNavigationStore} from "@/stores/navigationStore";
import {useOutsideClick} from "@/composables/useOutsideClick";

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
function syncViewportMode() {
  isMobileSheet.value = shouldUseMobileLayout.value;
}

function openAssistantSelector() {
  syncViewportMode();
  assistantMenuOpen.value = !assistantMenuOpen.value;
}

function selectAssistant(id) {
  emit("select-assistant", id);
  assistantMenuOpen.value = false;
}

function setSidebarCollapsed(value) {
  navigationStore.setSidebarCollapsed(value);
}

function setDrawerOpen(value) {
  navigationStore.setDrawerOpen(value);
}

function setCollapsedRecentOpen(value) {
  navigationStore.setCollapsedRecentOpen(value);
}

function handleNewChat() {
  emit("new-chat");
  setDrawerOpen(false);
  setCollapsedRecentOpen(false);
}

function openHistoryMenu(payload = {}) {
  const {item, event} = payload;
  syncViewportMode();
  historyMenuTarget.value = item || null;
  historyMenuReferenceEl.value = event?.currentTarget || null;
  historyMenuOpen.value = true;
}

function closeHistoryMenu() {
  historyMenuOpen.value = false;
  historyMenuTarget.value = null;
  historyMenuReferenceEl.value = null;
}

function selectHistoryMenuAction(action) {
  const history = historyMenuTarget.value;
  historyMenuOpen.value = false;
  if (!history || !action) return;
  emit("history-menu-action", {action, history});
}

function handleSelectHistory(item) {
  emit("select-history", item);
  setDrawerOpen(false);
}

function handleSelectHistoryCollapsed(item) {
  emit("select-history", item);
  setCollapsedRecentOpen(false);
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

async function handleViewportModeChange(isCompact) {
  syncViewportMode();
  if (isCompact) return;

  // PC 브라우저에서 모바일 폭으로 열려 있던 drawer가 웹 폭으로 전환될 때
  // 전역 .mobile-drawer fallback CSS가 남아 보이지 않도록 즉시 상태를 닫는다.
  setDrawerOpen(false);
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
      setDrawerOpen(false);
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
