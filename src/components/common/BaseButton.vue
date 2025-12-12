<template>
  <button
    class="base-button"
    :class="[
      `base-button--${variant}`,
      { 'base-button--block': block, 'base-button--disabled': disabled }
    ]"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: "BaseButton",
  inheritAttrs: false,
  props: {
    variant: {
      type: String,
      default: "primary"
    },
    block: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style lang="scss" scoped>
.base-button {
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  border-radius: var(--radius-md);
  height: var(--btn-height);
  padding: 0 var(--btn-padding-x);
  font-size: var(--control-font-size);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  transition: background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s,
    transform 0.08s ease, opacity 0.12s ease;
  background: transparent;

  &--block {
    width: 100%;
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  &--primary {
    background: var(--color-primary);
    color: #ffffff;
    box-shadow: var(--shadow-subtle);

    &:hover:not(.base-button--disabled) {
      box-shadow: var(--shadow-soft);
      transform: translateY(-1px);
    }

    &:active:not(.base-button--disabled) {
      transform: translateY(0);
      box-shadow: var(--shadow-subtle);
    }
  }

  &--ghost {
    background: transparent;
    color: var(--color-text);
    border: 1px solid var(--color-border);

    &:hover:not(.base-button--disabled) {
      background: var(--color-primary-soft);
    }
  }

  &--outline {
    background: transparent;
    color: var(--color-primary);
    border: 1px solid var(--color-primary);

    &:hover:not(.base-button--disabled) {
      background: var(--color-primary-soft);
    }
  }

  &--danger {
    background: #ef4444;
    color: #fff;

    &:hover:not(.base-button--disabled) {
      background: #dc2626;
    }
  }
}
</style>
