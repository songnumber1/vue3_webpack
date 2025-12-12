<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <span>© {{ year }} DS Assistant UI · Vue 3 · Responsive + Theme</span>
    </div>
  </footer>
</template>

<script>
export default {
  name: "AppFooter",
  data() {
    return {
      year: new Date().getFullYear()
    };
  }
};
</script>

<style lang="scss" scoped>
.app-footer {
  height: var(--layout-footer-height);
  border-top: 1px solid var(--color-border);
  background-color: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.app-footer__inner {
  width: 100%;
  max-width: var(--layout-max-width);
  padding: 0 var(--space-4);
  text-align: center;
}
</style>
