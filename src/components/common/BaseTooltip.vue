<template>
  <div
    class="base-tooltip__wrapper"
    @mouseenter="visible = true"
    @mouseleave="visible = false"
  >
    <slot />
    <div
      v-if="visible"
      class="base-tooltip base-tooltip--top"
      role="tooltip"
    >
      {{ text }}
    </div>
  </div>
</template>

<script>
export default {
  name: "BaseTooltip",
  props: {
    text: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      visible: false
    };
  }
};
</script>

<style lang="scss" scoped>
.base-tooltip__wrapper {
  position: relative;
  display: inline-block;
}

.base-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 4px);
  transform: translateX(-50%);
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.9);
  color: #fff;
  white-space: nowrap;
  font-size: var(--font-size-xs);
  z-index: 40;
}
</style>
