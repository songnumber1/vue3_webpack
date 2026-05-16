<!--
@file MobileSidebarDrawer.vue
@description Mobile navigation drawer markup separated from desktop sidebar.
-->

<template>
  <transition name="drawer-fade">
    <div v-if="open" class="mobile-drawer-backdrop" @click="$emit('close')"></div>
  </transition>

  <transition name="drawer-slide">
    <aside v-if="open" class="mobile-drawer">
      <div class="sidebar-content sidebar-content--mobile sidebar-content--assistant">
        <div class="sidebar-top">
          <SidebarAssistantSelector
            :assistants="assistants"
            :selected-assistant-id="selectedAssistantId"
            mobile
            @toggle="$emit('toggle-assistant')"
          />
          <div class="sidebar-top-actions">
            <button
              class="sidebar-round"
              type="button"
              :title="t('common.close')"
              :aria-label="t('common.close')"
              @click="$emit('close')"
            >
              ×
            </button>
          </div>
        </div>

        <nav class="quick-menu quick-menu--assistant quick-menu--mobile-search">
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

        <SidebarUserFooter
          @open-settings="$emit('open-settings')"
          @toggle-theme="$emit('toggle-theme')"
          @open-playground="$emit('open-playground')"
          @open-swagger="$emit('open-swagger')"
        />
      </div>
    </aside>
  </transition>
</template>

<script setup>
import {useI18n} from 'vue-i18n';
import Icon from '@/components/navigation/SidebarIcon.vue';
import SidebarAssistantSelector from '@/components/navigation/parts/SidebarAssistantSelector.vue';
import SidebarHistoryList from '@/components/navigation/parts/SidebarHistoryList.vue';
import SidebarUserFooter from '@/components/navigation/parts/SidebarUserFooter.vue';

const {t} = useI18n();

defineProps({
  open: {type: Boolean, default: false},
  assistants: {type: Array, default: () => []},
  histories: {type: Array, default: () => []},
  selectedAssistantId: {type: String, default: ''},
  selectedChatId: {type: [String, Number], default: null},
});

defineEmits([
  'close',
  'toggle-assistant',
  'new-chat',
  'select-history',
  'open-settings',
  'toggle-theme',
  'open-playground',
  'open-swagger',
]);
</script>
