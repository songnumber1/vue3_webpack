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

<style lang="scss">
@use "@/assets/styles/components/baseinput.scss";
</style>
