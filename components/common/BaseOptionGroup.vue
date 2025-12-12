<template>
  <div class="base-option-group">
    <div class="base-option-group__label">
      {{ label }}
    </div>
    <div class="base-option-group__options">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: "BaseOptionGroup",
  props: {
    label: {
      type: String,
      default: ""
    }
  }
};
</script>

<style lang="scss" scoped>
.base-option-group__label {
  padding: var(--space-2) var(--space-3);
  font-size: calc(var(--control-font-size) * 0.85);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.base-option-group__options {
  padding-bottom: var(--space-2);
}
</style>
