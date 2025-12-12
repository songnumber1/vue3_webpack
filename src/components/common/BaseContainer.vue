<template>
  <div class="base-container">
    <slot />
  </div>
</template>

<script>
export default {
  name: "BaseContainer"
};
</script>

<style lang="scss" scoped>
.base-container {
  width: 100%;
  max-width: var(--layout-max-width);
  margin: 0 auto;
  padding: 0 var(--space-4);
}
</style>
