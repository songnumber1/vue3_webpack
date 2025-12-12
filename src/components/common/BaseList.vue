<template>
  <ul class="base-list">
    <li
      v-for="(item, index) in items"
      :key="itemKey ? item[itemKey] : index"
      class="base-list__item"
      @click="$emit('item-click', item)"
    >
      <slot name="item" :item="item">
        {{ item }}
      </slot>
    </li>
  </ul>
</template>

<script>
export default {
  name: "BaseList",
  props: {
    items: {
      type: Array,
      default: () => []
    },
    itemKey: {
      type: String,
      default: ""
    }
  },
  emits: ["item-click"]
};
</script>

<style lang="scss" scoped>
.base-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.base-list__item {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
}

.base-list__item + .base-list__item {
  margin-top: var(--space-1);
}

.base-list__item:hover {
  background-color: var(--color-primary-soft);
}
</style>
