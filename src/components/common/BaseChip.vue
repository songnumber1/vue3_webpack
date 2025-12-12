<template>
  <span
    class="base-chip"
    :class="{
      'base-chip--selected': selected,
      'base-chip--clickable': clickable
    }"
    @click="handleClick"
  >
    <slot />
    <button
      v-if="closable"
      type="button"
      class="base-chip__close"
      @click.stop="$emit('close')"
    >
      ✕
    </button>
  </span>
</template>

<script>
export default {
  name: "BaseChip",
  props: {
    selected: {
      type: Boolean,
      default: false
    },
    closable: {
      type: Boolean,
      default: false
    },
    clickable: {
      type: Boolean,
      default: true
    }
  },
  emits: ["click", "close"],
  methods: {
    handleClick() {
      if (this.clickable) {
        this.$emit("click");
      }
    }
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/components/basechip.scss";
</style>
