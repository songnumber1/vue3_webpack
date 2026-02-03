
<template>
  <div class="p">
    <div class="row">
      <label class="lbl"><input type="checkbox" v-model="pv.showFooter" /> Show footer</label>
    </div>

    <div class="row">
      <div class="lbl2">Text</div>
      <input class="in" v-model="pv.footerText" />
    </div>

    <div class="row">
      <div class="lbl2">Height</div>
      <input class="range" type="range" min="28" max="72" v-model.number="pv.footerHeight" />
      <span class="val">{{ pv.footerHeight }}px</span>
    </div>
  </div>
</template>

<script>
import { useLayoutPreviewStore } from "@/stores/layoutPreviewStore";
export default { computed: { pv() { return useLayoutPreviewStore(); } } };
</script>

<style scoped>
.p { display:flex; flex-direction: column; gap: 10px; }
.row { display:flex; align-items:center; gap: 10px; }
.lbl { font-size: 13px; color: var(--text); }
.lbl2 { width: 110px; font-size: 12px; color: var(--muted); }
.in {
  flex:1; height: 34px; border-radius: 10px; border: 1px solid var(--border);
  background: transparent; color: var(--text); padding: 0 10px;
}
.range { flex:1; }
.val { width: 60px; font-size: 12px; color: var(--muted); text-align: right; }
</style>
