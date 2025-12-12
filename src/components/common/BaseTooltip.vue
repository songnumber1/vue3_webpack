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

<style lang="scss">
@use "@/assets/styles/components/basetooltip.scss";
</style>
