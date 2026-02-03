
<template>
  <div class="p">
    <div class="row">
      <div class="lbl2">Height</div>
      <input class="range" type="range" min="34" max="64" v-model.number="pv.inputHeight" />
      <span class="val">{{ pv.inputHeight }}px</span>
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
.lbl2 { width: 110px; font-size: 12px; color: var(--muted); }
.range { flex:1; }
.val { width: 60px; font-size: 12px; color: var(--muted); text-align: right; }
</style>
