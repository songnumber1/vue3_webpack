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
          aria-label="즐겨찾기 대화방"
          title="즐겨찾기"
        >
          📌
        </span>
        <button
          class="sidebar-history-menu-button"
          type="button"
          aria-label="대화방 메뉴 열기"
          title="대화방 메뉴"
          @click.stop="$emit('open-menu', {item, event: $event})"
        >
          ⋯
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  histories: {type: Array, default: () => []},
  selectedChatId: {type: [String, Number], default: ''},
  containerClass: {type: String, default: 'sidebar-history sidebar-history--main'},
  itemClass: {type: String, default: 'sidebar-history-item'},
});

defineEmits(['select', 'open-menu']);
</script>
