<template>
  <span class="base-badge" :class="`base-badge--${variant}`">
    <slot />
  </span>
</template>

<script>
export default {
  name: "BaseBadge",
  props: {
    variant: {
      type: String,
      default: "neutral"
    }
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/components/basebadge.scss";
</style>
