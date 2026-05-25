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
/**
 * @file components/navigation/parts/CollapsedSidebar.vue
 * @description 좌측 메뉴/드로어 관련 UI입니다. navigation store 상태와 사용자 메뉴 action을 화면에 연결합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

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
