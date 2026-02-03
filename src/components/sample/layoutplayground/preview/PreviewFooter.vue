
<template>
  <footer class="f" :class="{ focused }">
    <div>{{ pv.footerText }}</div>
  </footer>
</template>

<script>
import { useLayoutPreviewStore } from "@/stores/layoutPreviewStore";
export default {
  props: { focused: Boolean },
  computed: { pv() { return useLayoutPreviewStore(); } }
};
</script>

<style scoped>
.f {
  height: var(--pv-footer-h);
  display:flex; align-items:center;
  padding: 0 12px;
  background: var(--card);
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 12px;
}
.f.focused { outline: 2px solid var(--primary); outline-offset: -2px; }
</style>
