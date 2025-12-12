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

<style lang="scss">
@use "@/assets/styles/components/baseswitch.scss";
</style>
