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

<style lang="scss" scoped>
.base-label {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  margin-bottom: var(--space-1);
  display: inline-block;
}
</style>
