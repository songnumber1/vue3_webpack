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
        <SidebarHistoryList
          :histories="histories"
          :selected-chat-id="selectedChatId"
          @select="handleSelectHistory"
          @open-menu="openHistoryMenu"
        />

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

  <ChatHistoryActionMenu
    ref="historyMenuRef"
    :open="historyMenuOpen"
    :is-mobile="isMobileSheet"
    :target="historyMenuTarget"
    :position="historyMenuPosition"
    @close="closeHistoryMenu"
    @select="selectHistoryMenuAction"
  />
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
import ChatHistoryActionMenu from '@/components/navigation/parts/ChatHistoryActionMenu.vue';
import SidebarUserFooter from '@/components/navigation/parts/SidebarUserFooter.vue';
import {useAssistantStore} from '@/stores/assistantStore';
import {useChatStore} from '@/stores/chatStore';
import {useNavigationStore} from '@/stores/navigationStore';
import {useOutsideClick} from '@/composables/useOutsideClick';

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const emit = defineEmits([
  'new-chat',
  'select-history',
  'history-menu-action',
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
const historyMenuRef = ref(null);
const historyMenuOpen = ref(false);
const historyMenuTarget = ref(null);
const historyMenuPosition = ref({top: 0, left: 0});

const HISTORY_MENU_WIDTH_PX = 208;
const HISTORY_MENU_HEIGHT_PX = 196;
const HISTORY_MENU_GAP_PX = 8;
const VIEWPORT_PADDING_PX = 12;

/**
 * @description syncViewportMode 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function syncViewportMode() {
  isMobileSheet.value = Boolean(
    window.matchMedia?.(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`)?.matches ||
      document.querySelector('.app-container--mobile')
  );
}

/**
 * @description openAssistantSelector 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function openAssistantSelector() {
  syncViewportMode();
  assistantMenuOpen.value = !assistantMenuOpen.value;
}

/**
 * @description selectAssistant 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} id - id 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function selectAssistant(id) {
  emit('select-assistant', id);
  assistantMenuOpen.value = false;
}

/**
 * @description setSidebarCollapsed 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function setSidebarCollapsed(value) {
  navigationStore.setSidebarCollapsed(value);
}

/**
 * @description setDrawerOpen 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function setDrawerOpen(value) {
  navigationStore.setDrawerOpen(value);
}

/**
 * @description setCollapsedRecentOpen 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function setCollapsedRecentOpen(value) {
  navigationStore.setCollapsedRecentOpen(value);
}

/**
 * @description handleNewChat 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function handleNewChat() {
  emit('new-chat');
  setDrawerOpen(false);
  setCollapsedRecentOpen(false);
}


/**
 * @description openHistoryMenu 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} payload - 메뉴 대상 대화방과 클릭 이벤트입니다.
 * @returns {void}
 */
function openHistoryMenu(payload = {}) {
  const {item, event} = payload;
  syncViewportMode();
  historyMenuTarget.value = item || null;
  historyMenuPosition.value = getHistoryMenuPosition(event?.currentTarget);
  historyMenuOpen.value = true;
}

/**
 * @description 대화방 메뉴는 기본적으로 메뉴 버튼의 오른쪽에 띄우고, 화면 밖으로 나갈 때만 왼쪽 또는 화면 안쪽으로 보정합니다.
 * @param {HTMLElement|null} triggerElement - 메뉴 버튼 요소입니다.
 * @returns {{top: number, left: number}} fixed 레이어 좌표입니다.
 */
function getHistoryMenuPosition(triggerElement) {
  const rect = triggerElement?.getBoundingClientRect?.();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;

  if (!rect) {
    return {top: VIEWPORT_PADDING_PX, left: VIEWPORT_PADDING_PX};
  }

  const preferredLeft = rect.right + HISTORY_MENU_GAP_PX;
  const fallbackLeft = rect.left - HISTORY_MENU_WIDTH_PX - HISTORY_MENU_GAP_PX;
  const maxLeft = Math.max(VIEWPORT_PADDING_PX, viewportWidth - HISTORY_MENU_WIDTH_PX - VIEWPORT_PADDING_PX);
  const left =
    preferredLeft + HISTORY_MENU_WIDTH_PX <= viewportWidth - VIEWPORT_PADDING_PX
      ? preferredLeft
      : fallbackLeft >= VIEWPORT_PADDING_PX
        ? fallbackLeft
        : Math.min(Math.max(preferredLeft, VIEWPORT_PADDING_PX), maxLeft);

  const preferredTop = rect.top;
  const maxTop = Math.max(VIEWPORT_PADDING_PX, viewportHeight - HISTORY_MENU_HEIGHT_PX - VIEWPORT_PADDING_PX);

  return {
    top: Math.min(Math.max(preferredTop, VIEWPORT_PADDING_PX), maxTop),
    left: Math.min(Math.max(left, VIEWPORT_PADDING_PX), maxLeft),
  };
}

/**
 * @description closeHistoryMenu 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @returns {void}
 */
function closeHistoryMenu() {
  historyMenuOpen.value = false;
  historyMenuTarget.value = null;
}

/**
 * @description selectHistoryMenuAction 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {string} action - 선택된 메뉴 액션입니다.
 * @returns {void}
 */
function selectHistoryMenuAction(action) {
  const history = historyMenuTarget.value;
  historyMenuOpen.value = false;
  if (!history || !action) return;
  emit('history-menu-action', {action, history});
}

/**
 * @description handleSelectHistory 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} item - item 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function handleSelectHistory(item) {
  emit('select-history', item);
  setDrawerOpen(false);
}

/**
 * @description handleSelectHistoryCollapsed 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} item - item 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function handleSelectHistoryCollapsed(item) {
  emit('select-history', item);
  setCollapsedRecentOpen(false);
}

/**
 * @description openSettings 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function openSettings() {
  emit('open-settings');
}

/**
 * @description toggleTheme 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function toggleTheme() {
  emit('toggle-theme');
}

/**
 * @description openSwagger 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function openSwagger() {
  setDrawerOpen(false);
  emit('open-swagger');
}

/**
 * @description openPlayground 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
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

useOutsideClick(
  () => historyMenuRef.value?.menuRef?.value || historyMenuRef.value?.menuRef,
  closeHistoryMenu,
  {shouldIgnore: () => isMobileSheet.value || !historyMenuOpen.value}
);

// Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
onMounted(() => {
  syncViewportMode();
  window.addEventListener('resize', syncViewportMode, {passive: true});
});

// Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewportMode);
});
</script>
