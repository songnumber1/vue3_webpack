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

<style scoped lang="scss">
.bubble {
  max-width: var(--qa-bubble-max-width, 42rem);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-3);
  line-height: 1.55;
  font-size: var(--control-font-size);
}

.user {
  background: var(--color-primary);
  color: #fff;
  margin-left: auto;
}

.assistant {
  background: var(--color-bg-soft);
  color: var(--color-text);
  margin-right: auto;
}

.system {
  background: var(--color-accent);
  color: #fff;
}
</style>
