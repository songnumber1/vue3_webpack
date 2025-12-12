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

<style lang="scss">
@use "@/assets/styles/components/basetextarea.scss";
</style>
