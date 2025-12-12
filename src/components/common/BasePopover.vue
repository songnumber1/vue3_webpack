<template>
  <div class="base-popover__wrapper" ref="wrapper">
    <div @click="toggle">
      <slot name="trigger" />
    </div>
    <transition name="popover-fade">
      <div
        v-if="open"
        class="base-popover"
        ref="panel"
      >
        <slot />
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: "BasePopover",
  data() {
    return {
      open: false
    };
  },
  mounted() {
    document.addEventListener("click", this.handleOutside);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleOutside);
  },
  methods: {
    toggle() {
      this.open = !this.open;
    },
    handleOutside(e) {
      if (!this.$refs.wrapper) return;
      if (!this.$refs.wrapper.contains(e.target)) {
        this.open = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.base-popover__wrapper {
  position: relative;
  display: inline-block;
}

.base-popover {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 160px;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
  padding: var(--space-2);
  font-size: var(--font-size-sm);
  z-index: 45;
}

.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
