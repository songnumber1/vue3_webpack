<template>
  <aside class="desktop-sidebar" :class="{'desktop-sidebar--collapsed': sidebarCollapsed}">
    <div v-if="!sidebarCollapsed" class="sidebar-content sidebar-content--assistant">
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
          <button class="sidebar-round" type="button" :title="t('chat.hideSidebar')" :aria-label="t('chat.hideSidebar')" @click="setSidebarCollapsed(true)">
            ☰
          </button>
        </div>
      </div>

      <nav class="quick-menu quick-menu--assistant">
        <button class="quick-item active" type="button" @click="handleNewChat">
          <Icon name="pencil" />{{ t('chat.newChat') }}
        </button>
        <button class="quick-item" type="button">
          <Icon name="search" />{{ t('chat.chatSearch') }}
        </button>
      </nav>

      <div class="section-label">{{ t('chat.conversations') }}</div>
      <SidebarHistoryList :histories="histories" :selected-chat-id="selectedChatId" @select="handleSelectHistory" />
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
    <div v-if="drawerOpen" class="mobile-drawer-backdrop" @click="setDrawerOpen(false)"></div>
  </transition>

  <transition name="drawer-slide">
    <aside v-if="drawerOpen" class="mobile-drawer">
      <div class="sidebar-content sidebar-content--mobile sidebar-content--assistant">
        <div class="sidebar-top">
          <SidebarAssistantSelector
            :assistants="assistants"
            :selected-assistant-id="selectedAssistantId"
            mobile
            @toggle="openAssistantSelector"
          />
          <div class="sidebar-top-actions">
            <button class="sidebar-round" type="button" :title="t('common.close')" :aria-label="t('common.close')" @click="setDrawerOpen(false)">
              ×
            </button>
          </div>
        </div>

        <nav class="quick-menu quick-menu--assistant quick-menu--mobile-search">
          <button class="quick-item active" type="button" @click="handleNewChat">
            <Icon name="pencil" />{{ t('chat.newChat') }}
          </button>
          <button class="quick-item" type="button">
            <Icon name="search" />{{ t('chat.chatSearch') }}
          </button>
        </nav>

        <div class="section-label">{{ t('chat.conversations') }}</div>
        <SidebarHistoryList :histories="histories" :selected-chat-id="selectedChatId" @select="handleSelectHistory" />

        <SidebarUserFooter
          @open-settings="openSettings"
          @toggle-theme="toggleTheme"
          @open-playground="openPlayground"
          @open-swagger="openSwagger"
        />
      </div>
    </aside>
  </transition>

  <BaseBottomSheet :open="assistantMenuOpen && isMobileSheet" :title="t('chat.assistantSelect')" @close="assistantMenuOpen = false">
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
      <span v-if="assistant.id === selectedAssistantId" class="bottom-sheet-selected-indicator" aria-label="현재 선택된 값">
        <CheckIcon class="bottom-sheet-check" />
        <span class="sr-only">현재 선택된 값</span>
      </span>
    </button>
  </BaseBottomSheet>
</template>

<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue';
import {storeToRefs} from 'pinia';
import {useI18n} from 'vue-i18n';
import {MOBILE_BREAKPOINT_PX} from '@/constants/uiTokens';
import BaseBottomSheet from '@/components/common/bottom-sheet/BaseBottomSheet.vue';
import CheckIcon from '@/components/icons/CheckIcon.vue';
import Icon from '@/components/navigation/SidebarIcon.vue';
import CollapsedSidebar from '@/components/navigation/parts/CollapsedSidebar.vue';
import SidebarAssistantSelector from '@/components/navigation/parts/SidebarAssistantSelector.vue';
import SidebarHistoryList from '@/components/navigation/parts/SidebarHistoryList.vue';
import SidebarUserFooter from '@/components/navigation/parts/SidebarUserFooter.vue';
import {useAssistantStore} from '@/stores/assistantStore';
import {useChatStore} from '@/stores/chatStore';
import {useNavigationStore} from '@/stores/navigationStore';
import {useOutsideClick} from '@/composables/useOutsideClick';

const emit = defineEmits([
  'new-chat',
  'select-history',
  'select-assistant',
  'open-guide',
  'open-notice',
  'open-personalization',
  'open-language',
  'toggle-theme',
  'open-swagger',
  'open-playground',
  'open-settings',
]);
const {t} = useI18n();
const assistantStore = useAssistantStore();
const chatStore = useChatStore();
const navigationStore = useNavigationStore();
const {assistants, selectedAssistantId} = storeToRefs(assistantStore);
const {histories, selectedChatId} = storeToRefs(chatStore);
const {sidebarCollapsed, drawerOpen, collapsedRecentOpen} = storeToRefs(navigationStore);
const assistantMenuOpen = ref(false);
const isMobileSheet = ref(false);
const assistantSelectorRef = ref(null);

/**
 * Synchronizes whether assistant selection should render as a mobile bottom sheet.
 * @returns {void}
 */
function syncViewportMode() {
  isMobileSheet.value = Boolean(
    window.matchMedia?.(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`)?.matches ||
      document.querySelector('.app-container--mobile')
  );
}

/** Opens or closes the assistant selector. @returns {void} */
function openAssistantSelector() {
  syncViewportMode();
  assistantMenuOpen.value = !assistantMenuOpen.value;
}

/** @param {string} id Selected assistant id. @returns {void} */
function selectAssistant(id) {
  emit('select-assistant', id);
  assistantMenuOpen.value = false;
}

/** @param {boolean} value Collapsed state. @returns {void} */
function setSidebarCollapsed(value) {
  navigationStore.setSidebarCollapsed(value);
}

/** @param {boolean} value Drawer open state. @returns {void} */
function setDrawerOpen(value) {
  navigationStore.setDrawerOpen(value);
}

/** @param {boolean} value Collapsed recent popover open state. @returns {void} */
function setCollapsedRecentOpen(value) {
  navigationStore.setCollapsedRecentOpen(value);
}

/** Starts a new chat and closes temporary sidebar surfaces. @returns {void} */
function handleNewChat() {
  emit('new-chat');
  setDrawerOpen(false);
  setCollapsedRecentOpen(false);
}

/** @param {{id: string|number, title: string}} item Selected history item. @returns {void} */
function handleSelectHistory(item) {
  emit('select-history', item);
  setDrawerOpen(false);
}

/** @param {{id: string|number, title: string}} item Selected history item. @returns {void} */
function handleSelectHistoryCollapsed(item) {
  emit('select-history', item);
  setCollapsedRecentOpen(false);
}

/** @returns {void} */
function openSettings() {
  emit('open-settings');
}

/** @returns {void} */
function toggleTheme() {
  emit('toggle-theme');
}

/** @returns {void} */
function openSwagger() {
  setDrawerOpen(false);
  emit('open-swagger');
}

/** @returns {void} */
function openPlayground() {
  setDrawerOpen(false);
  emit('open-playground');
}


useOutsideClick(
  () => assistantSelectorRef.value?.rootRef?.value || assistantSelectorRef.value?.rootRef,
  () => {
    assistantMenuOpen.value = false;
  },
  {shouldIgnore: () => isMobileSheet.value}
);

onMounted(() => {
  syncViewportMode();
  window.addEventListener('resize', syncViewportMode, {passive: true});
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewportMode);
});
</script>
