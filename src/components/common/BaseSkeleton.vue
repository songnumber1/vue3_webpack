<template>
  <div class="base-skeleton" :style="styleObject" />
</template>

<script>
export default {
  name: "BaseSkeleton",
  props: {
    width: {
      type: String,
      default: "100%"
    },
    height: {
      type: String,
      default: "1rem"
    },
    radius: {
      type: String,
      default: "var(--radius-sm)"
    }
  },
  computed: {
    styleObject() {
      return {
        width: this.width,
        height: this.height,
        borderRadius: this.radius
      };
    }
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/components/baseskeleton.scss";
</style>
