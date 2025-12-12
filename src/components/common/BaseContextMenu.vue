<template>
  <div
    class="base-context"
    @contextmenu.prevent="openMenu"
    ref="wrapper"
  >
    <slot />
    <ul
      v-if="open"
      class="base-context__menu"
      :style="{ top: `${position.y}px`, left: `${position.x}px` }"
      ref="menu"
    >
      <li
        v-for="(item, index) in items"
        :key="index"
        class="base-context__item"
        @click="handleClick(item)"
      >
        {{ item.label }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "BaseContextMenu",
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  emits: ["select"],
  data() {
    return {
      open: false,
      position: { x: 0, y: 0 }
    };
  },
  mounted() {
    document.addEventListener("click", this.closeMenu);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.closeMenu);
  },
  methods: {
    openMenu(e) {
      this.open = true;
      this.position = { x: e.clientX, y: e.clientY };
    },
    closeMenu(e) {
      if (!this.open) return;
      if (this.$refs.menu && this.$refs.menu.contains(e.target)) return;
      this.open = false;
    },
    handleClick(item) {
      this.$emit("select", item);
      this.open = false;
    }
  }
};
</script>

<style lang="scss" scoped>
.base-context {
  position: relative;
}

.base-context__menu {
  position: fixed;
  margin: 0;
  padding: var(--space-1) 0;
  list-style: none;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
  min-width: 160px;
  z-index: 60;
}

.base-context__item {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.base-context__item:hover {
  background: var(--color-primary-soft);
}
</style>
