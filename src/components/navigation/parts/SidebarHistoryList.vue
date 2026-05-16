<!--
@file SidebarHistoryList.vue
@description Renders chat history items for desktop sidebar, mobile drawer, and collapsed popover.
-->

<template>
  <div :class="containerClass">
    <button
      v-for="item in histories"
      :key="item.id"
      :class="[itemClass, {selected: String(item.id) === String(selectedChatId)}]"
      type="button"
      :title="item.title"
      @click="$emit('select', item)"
    >
      <span>{{ item.title }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  histories: {type: Array, default: () => []},
  selectedChatId: {type: [String, Number], default: ''},
  containerClass: {type: String, default: 'sidebar-history sidebar-history--main'},
  itemClass: {type: String, default: 'sidebar-history-item'},
});

defineEmits(['select']);
</script>
