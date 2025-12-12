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

<style lang="scss">
@use "@/assets/styles/components/baselist.scss";
</style>
