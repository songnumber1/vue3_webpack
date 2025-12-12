<template>
  <div class="base-popover__wrapper" ref="wrapper">
    <div @click="toggle">
      <slot name="trigger" />
    </div>
    <transition name="popover-fade">
      <div
        v-if="open"
        class="base-popover"
        ref="panel"
      >
        <slot />
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: "BasePopover",
  data() {
    return {
      open: false
    };
  },
  mounted() {
    document.addEventListener("click", this.handleOutside);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleOutside);
  },
  methods: {
    toggle() {
      this.open = !this.open;
    },
    handleOutside(e) {
      if (!this.$refs.wrapper) return;
      if (!this.$refs.wrapper.contains(e.target)) {
        this.open = false;
      }
    }
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/components/basepopover.scss";
</style>
