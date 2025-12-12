<template>
  <label class="base-checkbox">
    <input
      type="checkbox"
      class="base-checkbox__input"
      :checked="modelValue"
      @change="$emit('update:modelValue', $event.target.checked)"
      v-bind="$attrs"
    />
    <span class="base-checkbox__box">
      <span v-if="modelValue" class="base-checkbox__check">✔</span>
    </span>
    <span class="base-checkbox__label">
      <slot />
    </span>
  </label>
</template>

<script>
export default {
  name: "BaseCheckbox",
  inheritAttrs: false,
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
.base-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.base-checkbox__input {
  display: none;
}

.base-checkbox__box {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.base-checkbox__check {
  font-size: 0.75rem;
  color: var(--color-primary);
}

.base-checkbox__label {
  user-select: none;
}
</style>
