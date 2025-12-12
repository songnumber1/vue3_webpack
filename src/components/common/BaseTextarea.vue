<template>
  <textarea
    class="base-textarea"
    :class="[
      { 'base-textarea--error': error },
      { 'base-textarea--block': block }
    ]"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    v-bind="$attrs"
  />
</template>

<script>
export default {
  name: "BaseTextarea",
  inheritAttrs: false,
  props: {
    modelValue: {
      type: String,
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
.base-textarea {
  width: auto;
  min-height: var(--textarea-min-height);
  padding: var(--space-2) var(--space-3);
  font-size: var(--control-font-size);

  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);

  resize: vertical;
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
