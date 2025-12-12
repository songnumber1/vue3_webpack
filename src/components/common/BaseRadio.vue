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

<style lang="scss">
@use "@/assets/styles/components/baseradio.scss";
</style>
