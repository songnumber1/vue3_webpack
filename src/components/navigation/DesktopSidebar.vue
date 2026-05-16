<!--
@file DesktopSidebar.vue
@description Desktop sidebar shell separated from mobile drawer markup.
-->

<template>
  <aside class="desktop-sidebar" :class="{'desktop-sidebar--collapsed': sidebarCollapsed}">
    <div v-if="!sidebarCollapsed" class="sidebar-content sidebar-content--assistant">
      <div class="sidebar-top">
        <SidebarAssistantSelector
          ref="assistantSelectorRef"
          :assistants="assistants"
          :selected-assistant-id="selectedAssistantId"
          :open="assistantMenuOpen"
          @toggle="$emit('toggle-assistant')"
          @select="$emit('select-assistant', $event)"
        />
        <div class="sidebar-top-actions">
          <button
            class="sidebar-round"
            type="button"
            :title="t('chat.hideSidebar')"
            :aria-label="t('chat.hideSidebar')"
            @click="$emit('set-collapsed', true)"
          >
            ☰
          </button>
        </div>
      </div>

      <nav class="quick-menu quick-menu--assistant">
        <button class="quick-item active" type="button" @click="$emit('new-chat')">
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
        @select="$emit('select-history', $event)"
      />
    </div>

    <CollapsedSidebar
      v-else
      :open="collapsedRecentOpen"
      :histories="histories"
      :selected-chat-id="selectedChatId"
      @expand="$emit('set-collapsed', false)"
      @new-chat="$emit('new-chat')"
      @set-recent-open="$emit('set-recent-open', $event)"
      @select-history="$emit('select-history-collapsed', $event)"
    />
  </aside>
</template>

<script setup>
import Icon from '@/components/navigation/SidebarIcon.vue';
import CollapsedSidebar from '@/components/navigation/parts/CollapsedSidebar.vue';
import SidebarAssistantSelector from '@/components/navigation/parts/SidebarAssistantSelector.vue';
import SidebarHistoryList from '@/components/navigation/parts/SidebarHistoryList.vue';
import {useI18n} from 'vue-i18n';

const {t} = useI18n();

defineProps({
  assistants: {type: Array, default: () => []},
  histories: {type: Array, default: () => []},
  selectedAssistantId: {type: String, default: ''},
  selectedChatId: {type: [String, Number], default: null},
  sidebarCollapsed: {type: Boolean, default: false},
  collapsedRecentOpen: {type: Boolean, default: false},
  assistantMenuOpen: {type: Boolean, default: false},
});

defineEmits([
  'toggle-assistant',
  'select-assistant',
  'set-collapsed',
  'set-recent-open',
  'new-chat',
  'select-history',
  'select-history-collapsed',
]);

defineExpose({});
</script>
