<template>
  <input
    class="base-input"
    :class="[
      { 'base-input--error': error },
      { 'base-input--block': block }
    ]"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    v-bind="$attrs"
  />
</template>

<script>
export default {
  name: "BaseInput",
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
.base-input {
  width: auto;
  height: var(--input-height);
  padding: 0 var(--space-3);
  font-size: var(--control-font-size);
  color: var(--color-text);

  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
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
    box-shadow: 0 0 0 0.125rem rgba(239, 68, 68, 0.25);
  }
}
</style>
