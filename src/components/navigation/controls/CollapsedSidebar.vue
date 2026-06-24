<template>
  <div
    ref="rootRef"
    class="collapsed-sidebar tw-flex tw-h-full tw-w-sidebarCollapsed tw-shrink-0 tw-flex-col tw-items-center tw-border-r tw-border-app-sidebarBorder tw-bg-app-sidebar"
    :aria-label="t('chat.collapsedSidebar')"
  >
    <div
      class="collapsed-sidebar-actions tw-flex tw-flex-col tw-items-center tw-gap-2"
    >
      <button
        class="collapsed-icon-button tw-inline-flex tw-items-center tw-justify-center tw-rounded-control tw-border tw-border-app-sidebarBorder tw-bg-app-control tw-text-app-sidebarIcon tw-transition"
        type="button"
        :title="t('chat.openSidebar')"
        :aria-label="t('chat.openSidebar')"
        @click="$emit('expand')"
      >
        <Icon name="panel" bare />
      </button>
      <button
        class="collapsed-icon-button tw-inline-flex tw-items-center tw-justify-center tw-rounded-control tw-border tw-border-app-sidebarBorder tw-bg-app-control tw-text-app-sidebarIcon tw-transition"
        type="button"
        :title="t('chat.newChat')"
        :aria-label="t('chat.newChat')"
        @click="$emit('new-chat')"
      >
        <Icon name="pencil" bare />
      </button>
      <button
        class="collapsed-icon-button tw-inline-flex tw-items-center tw-justify-center tw-rounded-control tw-border tw-border-app-sidebarBorder tw-bg-app-control tw-text-app-sidebarIcon tw-transition"
        type="button"
        :title="t('chat.chatSearch')"
        :aria-label="t('chat.chatSearch')"
        @click="$emit('chat-search')"
      >
        <Icon name="search" bare />
      </button>
      <button
        class="collapsed-icon-button collapsed-icon-button--active tw-inline-flex tw-items-center tw-justify-center tw-rounded-control tw-border tw-border-app-primary tw-bg-app-primarySoft tw-text-app-primary tw-transition"
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
        class="collapsed-recent-popover tw-absolute tw-z-popover tw-rounded-control tw-border tw-border-app-border tw-bg-app-menu tw-shadow-menu"
        :aria-label="t('chat.recentChats')"
      >
        <h2>{{ t("chat.recentChats") }}</h2>
        <SidebarHistoryListDesktop
          :histories="histories"
          :selected-chat-id="selectedChatId"
          container-class="collapsed-recent-list"
          item-class="collapsed-recent-item"
          use-overlay-scrollbar
          :show-actions="false"
          :show-menu="false"
          @select="$emit('select-history', $event)"
        />
      </section>
    </transition>
  </div>
</template>

<script setup>
/**
 * @file components/navigation/controls/CollapsedSidebar.vue
 * @description 좌측 메뉴/드로어 관련 UI입니다. navigation store 상태와 사용자 메뉴 action을 화면에 연결합니다.
 */

import {ref} from "vue";
import {useI18n} from "vue-i18n";
import Icon from "@/components/navigation/NavigationIcon.vue";
import SidebarHistoryListDesktop from "@/components/navigation/history/SidebarHistoryListDesktop.vue";
import {useOutsideClick} from "@/composables/events/useOutsideClick";

const {t} = useI18n();
const rootRef = ref(null);

const props = defineProps({
  open: {type: Boolean, default: false},
  histories: {type: Array, default: () => []},
  selectedChatId: {type: [String, Number], default: ""},
});

const emit = defineEmits([
  "expand",
  "new-chat",
  "set-recent-open",
  "chat-search",
  "select-history",
]);

useOutsideClick(
  rootRef,
  () => {
    emit("set-recent-open", false);
  },
  {shouldIgnore: () => !props.open}
);
</script>
