<template>
  <label class="base-radio">
    <input
      type="radio"
      class="base-radio__input"
      :checked="modelValue === value"
      @change="$emit('update:modelValue', value)"
      v-bind="$attrs"
    />
    <span class="base-radio__outer">
      <span v-if="modelValue === value" class="base-radio__inner"></span>
    </span>
    <span class="base-radio__label">
      <slot />
    </span>
  </label>
</template>

<script>
export default {
  name: "BaseRadio",
  inheritAttrs: false,
  props: {
    modelValue: {
      type: [String, Number],
      default: ""
    },
    value: {
      type: [String, Number],
      required: true
    }
  },
  emits: ["update:modelValue"]
};
</script>

<style lang="scss" scoped>
.base-radio {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.base-radio__input {
  display: none;
}

.base-radio__outer {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid var(--color-border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.base-radio__inner {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--color-primary);
}

.base-radio__label {
  user-select: none;
}
</style>
