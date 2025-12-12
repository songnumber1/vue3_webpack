<template>
  <label class="base-label">
    <slot />
  </label>
</template>

<script>
export default {
  name: "BaseLabel"
};
</script>

<style lang="scss">
@use "@/assets/styles/components/baselabel.scss";
</style>
