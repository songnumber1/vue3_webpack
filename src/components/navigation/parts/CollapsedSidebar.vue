<template>
  <div class="collapsed-sidebar" :aria-label="t('chat.collapsedSidebar')">
    <div class="collapsed-sidebar-actions">
      <button
        class="collapsed-icon-button"
        type="button"
        :title="t('chat.openSidebar')"
        :aria-label="t('chat.openSidebar')"
        @click="$emit('expand')"
      >
        <Icon name="panel" bare />
      </button>
      <button
        class="collapsed-icon-button"
        type="button"
        :title="t('chat.newChat')"
        :aria-label="t('chat.newChat')"
        @click="$emit('new-chat')"
      >
        <Icon name="pencil" bare />
      </button>
      <button
        class="collapsed-icon-button"
        type="button"
        :title="t('chat.chatSearch')"
        :aria-label="t('chat.chatSearch')"
        @click="$emit('set-recent-open', false)"
      >
        <Icon name="search" bare />
      </button>
      <button
        class="collapsed-icon-button collapsed-icon-button--active"
        type="button"
        :title="t('chat.recentChats')"
        :aria-label="t('chat.recentChats')"
        @click="$emit('set-recent-open', !open)"
      >
        <Icon name="chat" bare />
      </button>
    </div>

    <transition name="collapsed-popover-fade">
      <section
        v-if="open"
        class="collapsed-recent-popover"
        :aria-label="t('chat.recentChats')"
      >
        <h2>{{ t("chat.recentChats") }}</h2>
        <SidebarHistoryList
          :histories="histories"
          :selected-chat-id="selectedChatId"
          container-class="collapsed-recent-list"
          item-class="collapsed-recent-item"
          @select="$emit('select-history', $event)"
        />
      </section>
    </transition>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import Icon from "@/components/navigation/SidebarIcon.vue";
import SidebarHistoryList from "@/components/navigation/parts/SidebarHistoryList.vue";

const {t} = useI18n();

defineProps({
  open: {type: Boolean, default: false},
  histories: {type: Array, default: () => []},
  selectedChatId: {type: [String, Number], default: ""},
});

defineEmits(["expand", "new-chat", "set-recent-open", "select-history"]);
</script>

<style scoped>
/* Scoped layout guard: keep component roots and flex/grid children shrink-safe. */
</style>
