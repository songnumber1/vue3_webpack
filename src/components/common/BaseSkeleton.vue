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

<style lang="scss" scoped>
.base-skeleton {
  background: linear-gradient(
    90deg,
    #e5e7eb 0%,
    #f3f4f6 50%,
    #e5e7eb 100%
  );
  background-size: 200% 100%;
  animation: base-skeleton-shimmer 1.3s infinite linear;
}

@keyframes base-skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
