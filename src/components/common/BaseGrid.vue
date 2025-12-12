<template>
  <div class="base-grid" :style="gridStyle">
    <slot />
  </div>
</template>

<script>
export default {
  name: "BaseGrid",
  props: {
    cols: {
      type: Number,
      default: 3
    },
    gap: {
      type: String,
      default: "var(--space-3)"
    }
  },
  computed: {
    gridStyle() {
      return {
        display: "grid",
        gap: this.gap,
        gridTemplateColumns: `repeat(${this.cols}, minmax(0, 1fr))`
      };
    }
  }
};
</script>
