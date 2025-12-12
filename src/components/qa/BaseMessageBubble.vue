<template>
  <div class="bubble" :class="role">
    <slot />
  </div>
</template>

<script>
export default {
  name: "BaseMessageBubble",
  props: {
    role: { type: String, default: "user" } // user | assistant | system
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/components/basemessagebubble.scss";
</style>
