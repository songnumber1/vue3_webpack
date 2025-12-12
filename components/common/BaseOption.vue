<template>
  <div
    class="base-option"
    :class="{ 'base-option--selected': selected, 'base-option--disabled': disabled }"
    @click="onClick"
  >
    <slot>{{ label }}</slot>
  </div>
</template>

<script>
export default {
  name: "BaseOption",
  props: {
    value: {
      type: [String, Number, Object],
      required: true
    },
    label: {
      type: String,
      default: ""
    },
    disabled: {
      type: Boolean,
      default: false
    },
    selected: {
      type: Boolean,
      default: false
    }
  },
  emits: ["select"],
  methods: {
    onClick() {
      if (this.disabled) return;
      this.$emit("select", this.value);
    }
  }
};
</script>

<style lang="scss" scoped>
.base-option {
  padding: var(--space-2) var(--space-3);
  font-size: var(--control-font-size);
  color: var(--color-text);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background-color 0.12s ease, color 0.12s ease;
}

.base-option:hover {
  background: var(--color-primary-soft);
}

.base-option--selected {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.base-option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
