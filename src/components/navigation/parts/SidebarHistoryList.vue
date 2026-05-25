<template>
  <div :class="containerClass">
    <div
      v-for="item in histories"
      :key="item.id"
      class="sidebar-history-row"
      :class="{selected: String(item.id) === String(selectedChatId)}"
    >
      <button
        :class="[itemClass, 'sidebar-history-title-button']"
        type="button"
        :title="item.title"
        @click="$emit('select', item)"
      >
        <span>{{ item.title }}</span>
      </button>

      <div class="sidebar-history-actions">
        <span
          v-if="item.isPinned"
          class="sidebar-history-pin"
          :aria-label="t('chat.historyMenu.pin')"
          :title="t('chat.historyMenu.pin')"
        >
          📌
        </span>
        <button
          class="sidebar-history-menu-button"
          type="button"
          :aria-label="t('chat.historyMenu.title')"
          :title="t('chat.historyMenu.title')"
          @click.stop="$emit('open-menu', {item, event: $event})"
        >
          ⋯
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * @file components/navigation/parts/SidebarHistoryList.vue
 * @description 좌측 메뉴/드로어 관련 UI입니다. navigation store 상태와 사용자 메뉴 action을 화면에 연결합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {useI18n} from "vue-i18n";

const {t} = useI18n();

defineProps({
  histories: {type: Array, default: () => []},
  selectedChatId: {type: [String, Number], default: ""},
  containerClass: {
    type: String,
    default: "sidebar-history sidebar-history--main",
  },
  itemClass: {type: String, default: "sidebar-history-item"},
});

defineEmits(["select", "open-menu"]);
</script>

<style scoped>
.sidebar-history {
  min-width: 0;
}

.sidebar-history-item {
  min-width: 0;
}
</style>
