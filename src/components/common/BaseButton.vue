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

<style lang="scss">
@use "@/assets/styles/components/basebutton.scss";
</style>
