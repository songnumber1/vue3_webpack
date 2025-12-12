<template>
  <article class="base-card" :class="{ 'base-card--hoverable': hoverable }">
    <header v-if="$slots.header" class="base-card__header">
      <slot name="header" />
    </header>

    <section class="base-card__body">
      <slot />
    </section>

    <footer v-if="$slots.footer" class="base-card__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>

<script>
export default {
  name: "BaseCard",
  props: {
    hoverable: {
      type: Boolean,
      default: true
    }
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/components/basecard.scss";
</style>
