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

<style lang="scss">
@use "@/assets/styles/components/basecheckbox.scss";
</style>
