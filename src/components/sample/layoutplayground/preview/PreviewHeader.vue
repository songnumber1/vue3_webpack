
<template>
  <header class="h" :class="{ focused }">
    <div class="left">{{ pv.headerTitle }}</div>
    <div class="right">
      <span class="pill">Assistant</span>
      <span class="pill">Model</span>
    </div>
  </header>
</template>

<script>
import { useLayoutPreviewStore } from "@/stores/layoutPreviewStore";
export default {
  props: { focused: Boolean },
  computed: { pv() { return useLayoutPreviewStore(); } }
};
</script>

<style scoped>
.h {
  height: var(--pv-header-h);
  display:flex; align-items:center; justify-content: space-between;
  padding: 0 12px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
}
.h.focused { outline: 2px solid var(--primary); outline-offset: -2px; }
.left { font-weight: 800; color: var(--text); }
.right { display:flex; gap: 6px; }
.pill { font-size: 11px; padding: 4px 8px; border-radius: 999px; background: var(--chip); color: var(--text); }
</style>
