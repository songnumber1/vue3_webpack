<template>
  <footer class="footer">
    <span class="text">chat app</span>
  </footer>
</template>

<script>
export default { name: "AppFooter" };
</script>

<style scoped lang="scss">
.footer {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
  border-top: 1px solid var(--header-border, var(--border));
  background: color-mix(in srgb, var(--bg-surface) 75%, transparent);
  backdrop-filter: blur(10px);
}

.text {
  letter-spacing: 0.2px;
}
</style>
