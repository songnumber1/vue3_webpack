<template>
  <div class="base-option-group">
    <div class="base-option-group__label">
      {{ label }}
    </div>
    <div class="base-option-group__options">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: "BaseOptionGroup",
  props: {
    label: {
      type: String,
      default: "",
    },
  },
};
</script>

<style lang="scss">
@use "@/assets/styles/components/baseoptiongroup.scss";
</style>
