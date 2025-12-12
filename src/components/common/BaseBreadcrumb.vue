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

<style lang="scss" scoped>
.base-breadcrumb {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.base-breadcrumb__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  align-items: center;
}

.base-breadcrumb__link {
  cursor: pointer;
  color: var(--color-text-muted);
}

.base-breadcrumb__link:hover {
  color: var(--color-text);
}

.base-breadcrumb__current {
  color: var(--color-text);
  font-weight: 500;
}

.base-breadcrumb__separator {
  color: var(--color-text-muted);
}
</style>
