<template>
  <button
    type="button"
    class="base-switch"
    :class="{ 'base-switch--on': modelValue }"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="base-switch__track"></span>
    <span class="base-switch__thumb"></span>
    <span class="base-switch__label">
      <slot />
    </span>
  </button>
</template>

<script>
export default {
  name: "BaseSwitch",
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ["update:modelValue"]
};
</script>

<style lang="scss" scoped>
.base-switch {
  border: none;
  padding: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.base-switch__track {
  position: relative;
  width: 32px;
  height: 18px;
  border-radius: 999px;
  background: var(--color-border);
  transition: background-color 0.12s;
}

.base-switch__thumb {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #ffffff;
  margin-left: 1px;
  transform: translateX(0);
  transition: transform 0.16s;
  box-shadow: var(--shadow-subtle);
}

.base-switch--on .base-switch__track {
  background: var(--color-primary);
}

.base-switch--on .base-switch__thumb {
  transform: translateX(14px);
}

.base-switch__label {
  user-select: none;
}
</style>
