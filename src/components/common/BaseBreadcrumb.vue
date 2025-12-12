<template>
  <nav class="base-breadcrumb" aria-label="Breadcrumb">
    <ol class="base-breadcrumb__list">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="base-breadcrumb__item"
      >
        <span
          v-if="index < items.length - 1"
          class="base-breadcrumb__link"
          @click="$emit('navigate', item)"
        >
          {{ item.label }}
        </span>
        <span
          v-else
          class="base-breadcrumb__current"
          aria-current="page"
        >
          {{ item.label }}
        </span>
        <span
          v-if="index < items.length - 1"
          class="base-breadcrumb__separator"
        >
          /
        </span>
      </li>
    </ol>
  </nav>
</template>

<script>
export default {
  name: "BaseBreadcrumb",
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  emits: ["navigate"]
};
</script>

<style lang="scss">
@use "@/assets/styles/components/basebreadcrumb.scss";
</style>
