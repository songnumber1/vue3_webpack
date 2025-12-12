<template>
  <select
    class="base-select"
    :class="[
      { 'base-select--error': error },
      { 'base-select--block': block }
    ]"
    :value="modelValue"
    @change="$emit('update:modelValue', $event.target.value)"
    v-bind="$attrs"
  >
    <slot />
  </select>
</template>

<script>
export default {
  name: "BaseSelect",
  inheritAttrs: false,
  props: {
    modelValue: {
      type: [String, Number],
      default: ""
    },
    error: {
      type: Boolean,
      default: false
    },
    block: {
      type: Boolean,
      default: false
    }
  },
  emits: ["update:modelValue"]
};
</script>

<style lang="scss" scoped>
.base-select {
  height: var(--input-height);
  padding: 0 var(--space-3);
  font-size: var(--control-font-size);

  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);

  transition: border-color 0.12s, box-shadow 0.12s, background-color 0.12s;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 0.125rem var(--color-primary-soft);
  }

  &--block {
    width: 100%;
  }

  &--error {
    border-color: #ef4444;
  }
}
</style>
