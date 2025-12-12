<template>
  <span
    class="base-chip"
    :class="{
      'base-chip--selected': selected,
      'base-chip--clickable': clickable
    }"
    @click="handleClick"
  >
    <slot />
    <button
      v-if="closable"
      type="button"
      class="base-chip__close"
      @click.stop="$emit('close')"
    >
      ✕
    </button>
  </span>
</template>

<script>
export default {
  name: "BaseChip",
  props: {
    selected: {
      type: Boolean,
      default: false
    },
    closable: {
      type: Boolean,
      default: false
    },
    clickable: {
      type: Boolean,
      default: true
    }
  },
  emits: ["click", "close"],
  methods: {
    handleClick() {
      if (this.clickable) {
        this.$emit("click");
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.base-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0 var(--space-2);
  height: calc(var(--btn-height) * 0.6);
  border-radius: 999px;
  border: 1px solid var(--color-border);
  font-size: calc(var(--control-font-size) * 0.85);
  color: var(--color-text-muted);
  background: var(--color-bg-soft);
}

.base-chip--clickable {
  cursor: pointer;
}

.base-chip--selected {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.base-chip__close {
  border: none;
  background: transparent;
  font-size: 0.75rem;
  cursor: pointer;
}
</style>
