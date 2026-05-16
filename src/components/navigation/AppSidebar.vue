<!--
@file AppSidebar.vue
@description Responsive chat sidebar with desktop history navigation and mobile service menu.
-->

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
        <div ref="assistantSelectorRef" class="assistant-selector">
          <button
            class="assistant-trigger"
            type="button"
            :aria-label="t('chat.assistantSelect')"
            @click="openAssistantSelector"
          >
            <span>{{ currentAssistant.label }}</span>
            <ChevronDownIcon class="chevron chevron--selector" />
          </button>
          <div
            v-if="assistantMenuOpen && !isMobileSheet"
            class="assistant-menu"
          >
            <button
              v-for="assistant in assistants"
              :key="assistant.id"
              class="assistant-option"
              :class="{active: assistant.id === selectedAssistantId}"
              type="button"
              @click="selectAssistant(assistant.id)"
            >
              <span class="assistant-option-main">
                <strong>{{ assistant.label }}</strong>
                <small>{{ assistant.description }}</small>
              </span>
              <span
                v-if="assistant.id === selectedAssistantId"
                class="option-selected-indicator"
                aria-label="현재 선택된 값"
              >
                <CheckIcon class="option-check" />
                <span class="sr-only">현재 선택된 값</span>
              </span>
            </button>
          </div>
        </div>
        <div class="sidebar-top-actions">
          <button
            class="sidebar-round"
            type="button"
            :title="t('chat.hideSidebar')"
            :aria-label="t('chat.hideSidebar')"
            @click="emitSidebarCollapsed(true)"
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
      <div class="sidebar-history sidebar-history--main">
        <button
          v-for="item in histories"
          :key="item.id"
          class="sidebar-history-item"
          :class="{selected: String(item.id) === String(activeHistoryId)}"
          type="button"
          :title="item.title"
          @click="handleSelectHistory(item)"
        >
          <span>{{ item.title }}</span>
        </button>
      </div>
    </div>

    <div v-else class="collapsed-sidebar" aria-label="접힌 사이드바">
      <div class="collapsed-sidebar-actions">
        <button
          class="collapsed-icon-button"
          type="button"
          :title="t('chat.openSidebar')"
          :aria-label="t('chat.openSidebar')"
          @click="emitSidebarCollapsed(false)"
        >
          <Icon name="panel" bare />
        </button>
        <button
          class="collapsed-icon-button"
          type="button"
          :title="t('chat.newChat')"
          :aria-label="t('chat.newChat')"
          @click="handleNewChat"
        >
          <Icon name="pencil" bare />
        </button>
        <button
          class="collapsed-icon-button"
          type="button"
          :title="t('chat.chatSearch')"
          :aria-label="t('chat.chatSearch')"
          @click="emitCollapsedRecentOpen(false)"
        >
          <Icon name="search" bare />
        </button>
        <button
          class="collapsed-icon-button collapsed-icon-button--active"
          type="button"
          :title="t('chat.recentChats')"
          :aria-label="t('chat.recentChats')"
          @click="emitCollapsedRecentOpen(!collapsedRecentOpen)"
        >
          <Icon name="chat" bare />
        </button>
      </div>

      <transition name="collapsed-popover-fade">
        <section
          v-if="collapsedRecentOpen"
          class="collapsed-recent-popover"
          :aria-label="t('chat.recentChats')"
        >
          <h2>{{ t("chat.recentChats") }}</h2>
          <button
            v-for="item in histories"
            :key="item.id"
            class="collapsed-recent-item"
            type="button"
            :title="item.title"
            @click="handleSelectHistoryCollapsed(item)"
          >
            <span>{{ item.title }}</span>
          </button>
        </section>
      </transition>
    </div>
  </aside>

  <transition name="drawer-fade">
    <div
      v-if="drawerOpen"
      class="mobile-drawer-backdrop"
      @click="emitDrawerOpen(false)"
    ></div>
  </transition>

  <transition name="drawer-slide">
    <aside v-if="drawerOpen" class="mobile-drawer">
      <div
        class="sidebar-content sidebar-content--mobile sidebar-content--assistant"
      >
        <div class="sidebar-top">
          <div class="assistant-selector">
            <button
              class="assistant-trigger"
              type="button"
              :aria-label="t('chat.assistantSelect')"
              @click="openAssistantSelector"
            >
              <span>{{ currentAssistant.label }}</span>
              <ChevronDownIcon class="chevron chevron--selector" />
            </button>
          </div>
          <div class="sidebar-top-actions">
            <button
              class="sidebar-round"
              type="button"
              :title="t('common.close')"
              :aria-label="t('common.close')"
              @click="emitDrawerOpen(false)"
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
        <div class="sidebar-history sidebar-history--main">
          <button
            v-for="item in histories"
            :key="item.id"
            class="sidebar-history-item"
            :class="{selected: String(item.id) === String(activeHistoryId)}"
            type="button"
            :title="item.title"
            @click="handleSelectHistory(item)"
          >
            <span>{{ item.title }}</span>
          </button>
        </div>

        <div class="sidebar-user sidebar-user--mobile">
          <button
            class="sidebar-user-profile"
            type="button"
            :aria-label="t('common.settings')"
            @click="openSettings"
          >
            <div class="user-avatar">민</div>
            <div class="sidebar-user-main">
              <strong>민우 송</strong><small>{{ t("common.plus") }}</small>
            </div>
          </button>
          <div class="sidebar-user-actions">
            <button
              class="sidebar-user-action"
              type="button"
              :aria-label="t('common.theme')"
              @click="toggleTheme"
            >
              <span class="theme-glyph"></span>
            </button>
            <button
              class="sidebar-user-action"
              type="button"
              :aria-label="t('common.playground')"
              :title="t('common.playground')"
              @click="openPlayground"
            >
              <span class="playground-glyph">▦</span>
            </button>
            <button
              class="sidebar-user-action"
              type="button"
              :aria-label="t('common.swagger')"
              @click="openSwagger"
            >
              <SwaggerDocIcon />
            </button>
          </div>
        </div>
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
        aria-label="현재 선택된 값"
      >
        <CheckIcon class="bottom-sheet-check" />
        <span class="sr-only">현재 선택된 값</span>
      </span>
    </button>
  </BaseBottomSheet>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import Icon from "@/components/navigation/SidebarIcon.vue";
import SwaggerDocIcon from "@/components/icons/SwaggerDocIcon.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";

const props = defineProps({
  histories: {type: Array, required: true},
  assistants: {type: Array, required: true},
  selectedAssistantId: {type: String, required: true},
  activeHistoryId: {type: [String, Number], default: null},
  sidebarCollapsed: {type: Boolean, required: true},
  drawerOpen: {type: Boolean, required: true},
  collapsedRecentOpen: {type: Boolean, required: true},
});

const emit = defineEmits([
  "update:sidebarCollapsed",
  "update:drawerOpen",
  "update:collapsedRecentOpen",
  "update:selectedAssistantId",
  "new-chat",
  "select-history",
  "select-history-collapsed",
  "open-guide",
  "open-notice",
  "open-personalization",
  "open-language",
  "toggle-theme",
  "open-swagger",
  "open-playground",
  "open-settings",
]);
const {t} = useI18n();
const assistantMenuOpen = ref(false);
const isMobileSheet = ref(false);
const assistantSelectorRef = ref(null);
const currentAssistant = computed(
  () =>
    props.assistants.find((item) => item.id === props.selectedAssistantId) ||
    props.assistants[0] || {id: "", label: "Assistant", description: ""}
);

/**
 * Synchronizes whether assistant selection should render as a mobile bottom sheet.
 * @returns {void}
 */
function syncViewportMode() {
  isMobileSheet.value = Boolean(
    window.matchMedia?.("(max-width: 900px)")?.matches ||
    document.querySelector(".app-container--mobile")
  );
}

/**
 * Opens or closes the assistant selector.
 * @returns {void}
 */
function openAssistantSelector() {
  syncViewportMode();
  assistantMenuOpen.value = !assistantMenuOpen.value;
}

/**
 * Selects an assistant and closes the selector.
 * @param {string} id Selected assistant id.
 * @returns {void}
 */
function selectAssistant(id) {
  emit("update:selectedAssistantId", id);
  assistantMenuOpen.value = false;
}

/**
 * Emits the sidebar collapsed state.
 * @param {boolean} value Collapsed state.
 * @returns {void}
 */
function emitSidebarCollapsed(value) {
  emit("update:sidebarCollapsed", value);
}

/**
 * Emits the mobile drawer open state.
 * @param {boolean} value Drawer open state.
 * @returns {void}
 */
function emitDrawerOpen(value) {
  emit("update:drawerOpen", value);
}

/**
 * Emits the collapsed recent popover open state.
 * @param {boolean} value Popover open state.
 * @returns {void}
 */
function emitCollapsedRecentOpen(value) {
  emit("update:collapsedRecentOpen", value);
}

/**
 * Starts a new chat and closes temporary sidebar surfaces.
 * @returns {void}
 */
function handleNewChat() {
  emit("new-chat");
  emitDrawerOpen(false);
  emitCollapsedRecentOpen(false);
}

/**
 * Selects a history item from expanded sidebar.
 * @param {{id: string|number, title: string}} item Selected history item.
 * @returns {void}
 */
function handleSelectHistory(item) {
  emit("select-history", item);
  emitDrawerOpen(false);
}

/**
 * Selects a history item from collapsed sidebar popover.
 * @param {{id: string|number, title: string}} item Selected history item.
 * @returns {void}
 */
function handleSelectHistoryCollapsed(item) {
  emit("select-history-collapsed", item);
  emitCollapsedRecentOpen(false);
}

/**
 * Opens the full-screen mobile settings navigator from the drawer user profile row.
 * @returns {void}
 */
function openSettings() {
  emit("open-settings");
}

/**
 * Toggles the theme from the mobile user area.
 * @returns {void}
 */
function toggleTheme() {
  emit("toggle-theme");
}

/**
 * Opens Swagger documentation from the mobile user area.
 * @returns {void}
 */
function openSwagger() {
  emitDrawerOpen(false);
  emit("open-swagger");
}

/**
 * Opens the playground route from the mobile user area.
 * @returns {void}
 */
function openPlayground() {
  emitDrawerOpen(false);
  emit("open-playground");
}

/**
 * Closes the desktop assistant menu when the user clicks outside.
 * @param {MouseEvent} event Document click event.
 * @returns {void}
 */
function handleDocumentClick(event) {
  if (isMobileSheet.value) return;
  if (assistantSelectorRef.value?.contains(event.target)) return;
  assistantMenuOpen.value = false;
}

onMounted(() => {
  syncViewportMode();
  document.addEventListener("click", handleDocumentClick);
  window.addEventListener("resize", syncViewportMode, {passive: true});
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
  window.removeEventListener("resize", syncViewportMode);
});
</script>
