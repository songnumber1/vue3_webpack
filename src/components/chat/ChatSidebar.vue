<template>
  <aside class="desktop-sidebar" :class="{'desktop-sidebar--collapsed': sidebarCollapsed}">
    <div v-if="!sidebarCollapsed" class="sidebar-content sidebar-content--assistant">
      <div class="sidebar-top">
        <div class="assistant-selector" ref="assistantSelectorRef">
          <button class="assistant-trigger" type="button" @click="openAssistantSelector" aria-label="Assistant 선택">
            <span>{{ currentAssistant.label }}</span>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div v-if="assistantMenuOpen && !isMobileSheet" class="assistant-menu">
            <button v-for="assistant in assistants" :key="assistant.id" class="assistant-option" :class="{active: assistant.id === selectedAssistantId}" type="button" @click="selectAssistant(assistant.id)">
              <strong>{{ assistant.label }}</strong>
              <small>{{ assistant.description }}</small>
            </button>
          </div>
        </div>
        <div class="sidebar-top-actions">
          <button class="sidebar-round" type="button" title="사이드바 숨기기" aria-label="사이드바 숨기기" @click="emitSidebarCollapsed(true)">☰</button>
        </div>
      </div>

      <nav class="quick-menu quick-menu--assistant">
        <button class="quick-item active" type="button" @click="handleNewChat"><Icon name="pencil" />새 채팅</button>
        <button class="quick-item" type="button"><Icon name="search" />채팅 검색</button>
      </nav>

      <div class="section-label">대화</div>
      <div class="sidebar-history sidebar-history--main">
        <button v-for="item in histories" :key="item.id" class="sidebar-history-item" :class="{selected: Number(item.id) === Number(activeHistoryId)}" type="button" :title="item.title" @click="handleSelectHistory(item)">
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
        <button class="collapsed-icon-button" type="button" title="사이드바 열기" aria-label="사이드바 열기" @click="emitSidebarCollapsed(false)"><Icon name="panel" bare /></button>
        <button class="collapsed-icon-button" type="button" title="새 채팅" aria-label="새 채팅" @click="handleNewChat"><Icon name="pencil" bare /></button>
        <button class="collapsed-icon-button" type="button" title="채팅 검색" aria-label="채팅 검색" @click="emitCollapsedRecentOpen(false)"><Icon name="search" bare /></button>
        <button class="collapsed-icon-button collapsed-icon-button--active" type="button" title="최근 채팅" aria-label="최근 채팅" @click="emitCollapsedRecentOpen(!collapsedRecentOpen)"><Icon name="chat" bare /></button>
      </div>

      <transition name="collapsed-popover-fade">
        <section v-if="collapsedRecentOpen" class="collapsed-recent-popover" aria-label="최근 채팅 목록">
          <h2>최근 채팅</h2>
          <button v-for="item in histories" :key="item.id" class="collapsed-recent-item" type="button" :title="item.title" @click="handleSelectHistoryCollapsed(item)"><span>{{ item.title }}</span></button>
        </section>
      </transition>

      <button class="collapsed-user-button" type="button" title="사용자" aria-label="사용자" @click="emitCollapsedRecentOpen(false)">민</button>
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
            <button class="assistant-trigger" type="button" @click="openAssistantSelector" aria-label="Assistant 선택">
              <span>{{ currentAssistant.label }}</span>
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <div class="sidebar-top-actions">
            <button class="sidebar-round" type="button" title="닫기" aria-label="닫기" @click="emitDrawerOpen(false)">×</button>
          </div>
        </div>

        <nav class="quick-menu quick-menu--assistant">
          <button class="quick-item active" type="button" @click="handleNewChat"><Icon name="pencil" />새 채팅</button>
          <button class="quick-item" type="button"><Icon name="search" />채팅 검색</button>
        </nav>

        <div class="section-label">대화</div>
        <div class="sidebar-history sidebar-history--main">
          <button v-for="item in histories" :key="item.id" class="sidebar-history-item" :class="{selected: Number(item.id) === Number(activeHistoryId)}" type="button" :title="item.title" @click="handleSelectHistory(item)">
            <span>{{ item.title }}</span>
          </button>
        </div>

        <button class="mobile-new-chat-fab" type="button" @click="handleNewChat"><Icon name="pencil" />채팅</button>

        <div class="sidebar-user">
          <div class="user-avatar">민</div>
          <div><strong>민우 송</strong><small>Plus</small></div>
        </div>
      </div>
    </aside>
  </transition>

  <BaseBottomSheet :open="assistantMenuOpen && isMobileSheet" title="Assistant 선택" @close="assistantMenuOpen = false">
    <button v-for="assistant in assistants" :key="assistant.id" class="bottom-sheet-option" :class="{active: assistant.id === selectedAssistantId}" type="button" @click="selectAssistant(assistant.id)">
      <strong>{{ assistant.label }}</strong>
      <small>{{ assistant.description }}</small>
    </button>
  </BaseBottomSheet>
</template>

<script setup>
import {computed, defineComponent, h, onBeforeUnmount, onMounted, ref} from 'vue'
import BaseBottomSheet from './BaseBottomSheet.vue'

const props = defineProps({
  histories: {type: Array, required: true},
  assistants: {type: Array, required: true},
  selectedAssistantId: {type: String, required: true},
  activeHistoryId: {type: [String, Number], default: null},
  sidebarCollapsed: {type: Boolean, required: true},
  drawerOpen: {type: Boolean, required: true},
  collapsedRecentOpen: {type: Boolean, required: true},
})

const emit = defineEmits(['update:sidebarCollapsed', 'update:drawerOpen', 'update:collapsedRecentOpen', 'update:selectedAssistantId', 'new-chat', 'select-history', 'select-history-collapsed'])
const assistantMenuOpen = ref(false)
const isMobileSheet = ref(false)
const assistantSelectorRef = ref(null)
const currentAssistant = computed(() => props.assistants.find((item) => item.id === props.selectedAssistantId) || props.assistants[0])

const ICONS = {
  pencil: '<path d="M4 16.5V20h3.5L18.1 9.4 14.6 5.9 4 16.5Z"/><path d="M13.4 7.1 16.9 10.6"/>',
  search: '<circle cx="10.5" cy="10.5" r="5.8"/><path d="M15 15 20 20"/>',
  panel: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 4v16"/>',
  chat: '<path d="M5 6.8A4 4 0 0 1 9 3h6a4 4 0 0 1 4 4v4.3a4 4 0 0 1-4 4H9.3L5 20v-4.7a4 4 0 0 1-1-2.7V6.8Z"/>',
}
const Icon = defineComponent({
  name: 'ChatSidebarIcon',
  props: {name: {type: String, required: true}, bare: {type: Boolean, default: false}},
  setup(iconProps) {
    return () => {
      const svg = h('svg', {class: 'nav-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', innerHTML: ICONS[iconProps.name] || ICONS.chat, 'aria-hidden': 'true'})
      return iconProps.bare ? svg : h('span', {class: 'icon-wrap'}, [svg])
    }
  },
})

function syncViewportMode() { isMobileSheet.value = Boolean(window.matchMedia?.('(max-width: 900px)')?.matches || document.querySelector('.app-shell--mobile')) }
function openAssistantSelector() { syncViewportMode(); assistantMenuOpen.value = !assistantMenuOpen.value }
function selectAssistant(id) { emit('update:selectedAssistantId', id); assistantMenuOpen.value = false }
function emitSidebarCollapsed(value) { emit('update:sidebarCollapsed', value) }
function emitDrawerOpen(value) { emit('update:drawerOpen', value) }
function emitCollapsedRecentOpen(value) { emit('update:collapsedRecentOpen', value) }
function handleNewChat() { emit('new-chat'); emitDrawerOpen(false); emitCollapsedRecentOpen(false) }
function handleSelectHistory(item) { emit('select-history', item); emitDrawerOpen(false) }
function handleSelectHistoryCollapsed(item) { emit('select-history-collapsed', item); emitCollapsedRecentOpen(false) }
function handleDocumentClick(event) {
  if (isMobileSheet.value) return
  if (assistantSelectorRef.value?.contains(event.target)) return
  assistantMenuOpen.value = false
}

onMounted(() => { syncViewportMode(); document.addEventListener('click', handleDocumentClick); window.addEventListener('resize', syncViewportMode, {passive: true}) })
onBeforeUnmount(() => { document.removeEventListener('click', handleDocumentClick); window.removeEventListener('resize', syncViewportMode) })
</script>
