
<template>
  <aside class="s" :class="{ focused }">
    <div class="title">{{ pv.sidebarTitle }}</div>
    <div class="item" v-for="n in 6" :key="n">
      Conversation {{ n }}
    </div>
  </aside>
</template>

<script>
import { useLayoutPreviewStore } from "@/stores/layoutPreviewStore";
export default {
  props: { focused: Boolean },
  computed: { pv() { return useLayoutPreviewStore(); } }
};
</script>

<style scoped>
.s {
  width: var(--pv-sidebar-w);
  background: var(--card2);
  border-right: 1px solid var(--border);
  padding: 12px;
  display:flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
}
.s.focused { outline: 2px solid var(--primary); outline-offset: -2px; }
.title { font-weight: 800; color: var(--text); }
.item { font-size: 12px; color: var(--muted); padding: 6px 8px; border-radius: 10px; background: var(--chip); }
</style>
