<!--
@file ChatSidebar.vue * @description Vue component used in the chat web
application runtime. * @author OpenAI
-->

<template>
  <aside class="desktop-sidebar" :class="{ 'desktop-sidebar--collapsed': sidebarCollapsed }">
    <div v-if="!sidebarCollapsed" class="sidebar-content sidebar-content--assistant">
      <div class="sidebar-top">
        <div ref="assistantSelectorRef" class="assistant-selector">
          <button
            class="assistant-trigger"
            type="button"
            aria-label="Assistant 선택"
            @click="openAssistantSelector"
          >
            <span>{{ currentAssistant.label }}</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M5.5 7.5 10 12l4.5-4.5"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div v-if="assistantMenuOpen && !isMobileSheet" class="assistant-menu">
            <button
              v-for="assistant in assistants"
              :key="assistant.id"
              class="assistant-option"
              :class="{ active: assistant.id === selectedAssistantId }"
              type="button"
              @click="selectAssistant(assistant.id)"
            >
              <strong>{{ assistant.label }}</strong>
              <small>{{ assistant.description }}</small>
            </button>
          </div>
        </div>
        <div class="sidebar-top-actions">
          <button
            class="sidebar-round"
            type="button"
            title="사이드바 숨기기"
            aria-label="사이드바 숨기기"
            @click="emitSidebarCollapsed(true)"
          >
            ☰
          </button>
        </div>
      </div>

      <nav class="quick-menu quick-menu--assistant">
        <button class="quick-item active" type="button" @click="handleNewChat">
          <Icon name="pencil" />새 채팅
        </button>
        <button class="quick-item" type="button"><Icon name="search" />채팅 검색</button>
      </nav>

      <div class="section-label">대화</div>
      <div class="sidebar-history sidebar-history--main">
        <button
          v-for="item in histories"
          :key="item.id"
          class="sidebar-history-item"
          :class="{ selected: Number(item.id) === Number(activeHistoryId) }"
          type="button"
          :title="item.title"
          @click="handleSelectHistory(item)"
        >
          <span>{{ item.title }}</span>
        </button>
      </div>

      <div class="sidebar-user">
        <div class="user-avatar">민</div>
        <div><strong>민우 송</strong><small>Plus</small></div>
      </div>
    </div>

    <div v-else class="collapsed-sidebar" aria-label="접힌 사이드바">
      <div class="collapsed-sidebar-actions">
        <button
          class="collapsed-icon-button"
          type="button"
          title="사이드바 열기"
          aria-label="사이드바 열기"
          @click="emitSidebarCollapsed(false)"
        >
          <Icon name="panel" bare />
        </button>
        <button
          class="collapsed-icon-button"
          type="button"
          title="새 채팅"
          aria-label="새 채팅"
          @click="handleNewChat"
        >
          <Icon name="pencil" bare />
        </button>
        <button
          class="collapsed-icon-button"
          type="button"
          title="채팅 검색"
          aria-label="채팅 검색"
          @click="emitCollapsedRecentOpen(false)"
        >
          <Icon name="search" bare />
        </button>
        <button
          class="collapsed-icon-button collapsed-icon-button--active"
          type="button"
          title="최근 채팅"
          aria-label="최근 채팅"
          @click="emitCollapsedRecentOpen(!collapsedRecentOpen)"
        >
          <Icon name="chat" bare />
        </button>
      </div>

      <transition name="collapsed-popover-fade">
        <section
          v-if="collapsedRecentOpen"
          class="collapsed-recent-popover"
          aria-label="최근 채팅 목록"
        >
          <h2>최근 채팅</h2>
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

      <button
        class="collapsed-user-button"
        type="button"
        title="사용자"
        aria-label="사용자"
        @click="emitCollapsedRecentOpen(false)"
      >
        민
      </button>
    </div>
  </aside>

  <transition name="drawer-fade">
    <div v-if="drawerOpen" class="mobile-drawer-backdrop" @click="emitDrawerOpen(false)"></div>
  </transition>

  <transition name="drawer-slide">
    <aside v-if="drawerOpen" class="mobile-drawer">
      <div class="sidebar-content sidebar-content--mobile sidebar-content--assistant">
        <div class="sidebar-top">
          <div class="assistant-selector">
            <button
              class="assistant-trigger"
              type="button"
              aria-label="Assistant 선택"
              @click="openAssistantSelector"
            >
              <span>{{ currentAssistant.label }}</span>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M5.5 7.5 10 12l4.5-4.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
          <div class="sidebar-top-actions">
            <button
              class="sidebar-round"
              type="button"
              title="닫기"
              aria-label="닫기"
              @click="emitDrawerOpen(false)"
            >
              ×
            </button>
          </div>
        </div>

        <nav class="quick-menu quick-menu--assistant">
          <button class="quick-item active" type="button" @click="handleNewChat">
            <Icon name="pencil" />새 채팅
          </button>
          <button class="quick-item" type="button"><Icon name="search" />채팅 검색</button>
        </nav>

        <div class="section-label">대화</div>
        <div class="sidebar-history sidebar-history--main">
          <button
            v-for="item in histories"
            :key="item.id"
            class="sidebar-history-item"
            :class="{ selected: Number(item.id) === Number(activeHistoryId) }"
            type="button"
            :title="item.title"
            @click="handleSelectHistory(item)"
          >
            <span>{{ item.title }}</span>
          </button>
        </div>

        <button class="mobile-new-chat-fab" type="button" @click="handleNewChat">
          <Icon name="pencil" />채팅
        </button>

        <div class="sidebar-user">
          <div class="user-avatar">민</div>
          <div><strong>민우 송</strong><small>Plus</small></div>
        </div>
      </div>
    </aside>
  </transition>

  <BaseBottomSheet
    :open="assistantMenuOpen && isMobileSheet"
    title="Assistant 선택"
    @close="assistantMenuOpen = false"
  >
    <button
      v-for="assistant in assistants"
      :key="assistant.id"
      class="bottom-sheet-option"
      :class="{ active: assistant.id === selectedAssistantId }"
      type="button"
      @click="selectAssistant(assistant.id)"
    >
      <strong>{{ assistant.label }}</strong>
      <small>{{ assistant.description }}</small>
    </button>
  </BaseBottomSheet>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import BaseBottomSheet from "./BaseBottomSheet.vue";
import Icon from "./ChatSidebarIcon.vue";

const props = defineProps({
  histories: { type: Array, required: true },
  assistants: { type: Array, required: true },
  selectedAssistantId: { type: String, required: true },
  activeHistoryId: { type: [String, Number], default: null },
  sidebarCollapsed: { type: Boolean, required: true },
  drawerOpen: { type: Boolean, required: true },
  collapsedRecentOpen: { type: Boolean, required: true }
});

const emit = defineEmits([
  "update:sidebarCollapsed",
  "update:drawerOpen",
  "update:collapsedRecentOpen",
  "update:selectedAssistantId",
  "new-chat",
  "select-history",
  "select-history-collapsed"
]);
const assistantMenuOpen = ref(false);
const isMobileSheet = ref(false);
const assistantSelectorRef = ref(null);
const currentAssistant = computed(
  () =>
    props.assistants.find((item) => item.id === props.selectedAssistantId) || props.assistants[0]
);

/**
 * 현재 viewport가 모바일 bottom sheet 모드인지 동기화합니다.
 * @returns {void}
 */
function syncViewportMode() {
  isMobileSheet.value = Boolean(
    window.matchMedia?.("(max-width: 900px)")?.matches ||
    document.querySelector(".app-shell--mobile")
  );
}
/**
 * Assistant 선택 UI를 데스크톱 메뉴 또는 모바일 bottom sheet 형태로 엽니다.
 * @returns {void}
 */
function openAssistantSelector() {
  syncViewportMode();
  assistantMenuOpen.value = !assistantMenuOpen.value;
}
/**
 * 선택한 Assistant id를 부모 컴포넌트에 전달합니다.
 * @param {string} id 선택된 Assistant id
 * @returns {void}
 */
/**
 * selectAssistant 처리 함수입니다.
 * @param {*} id 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function selectAssistant(id) {
  emit("update:selectedAssistantId", id);
  assistantMenuOpen.value = false;
}
/** @param {boolean} value 사이드바 접힘 여부 */
function emitSidebarCollapsed(value) {
  emit("update:sidebarCollapsed", value);
}
/** @param {boolean} value 모바일 drawer 표시 여부 */
function emitDrawerOpen(value) {
  emit("update:drawerOpen", value);
}
/** @param {boolean} value 접힌 사이드바 최근 대화 팝오버 표시 여부 */
function emitCollapsedRecentOpen(value) {
  emit("update:collapsedRecentOpen", value);
}
/** 새 채팅 생성을 요청하고 열린 보조 UI를 닫습니다. */
function handleNewChat() {
  emit("new-chat");
  emitDrawerOpen(false);
  emitCollapsedRecentOpen(false);
}
/**
 * 대화 이력 선택 이벤트를 부모 컴포넌트에 전달합니다.
 * @param {{id: string|number, title: string}} item 선택한 대화 이력
 */
function handleSelectHistory(item) {
  emit("select-history", item);
  emitDrawerOpen(false);
}
/**
 * 접힌 사이드바 팝오버에서 대화 이력을 선택합니다.
 * @param {{id: string|number, title: string}} item 선택한 대화 이력
 */
function handleSelectHistoryCollapsed(item) {
  emit("select-history-collapsed", item);
  emitCollapsedRecentOpen(false);
}
/**
 * Assistant 메뉴 외부 클릭 시 데스크톱 dropdown을 닫습니다.
 * @param {MouseEvent} event 문서 클릭 이벤트
 */
function handleDocumentClick(event) {
  if (isMobileSheet.value) return;
  if (assistantSelectorRef.value?.contains(event.target)) return;
  assistantMenuOpen.value = false;
}

onMounted(() => {
  syncViewportMode();
  document.addEventListener("click", handleDocumentClick);
  window.addEventListener("resize", syncViewportMode, { passive: true });
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
  window.removeEventListener("resize", syncViewportMode);
});
</script>
