
<template>
  <div class="p">
    <div class="row">
      <div class="lbl2">Max height</div>
      <input class="range" type="range" min="140" max="420" v-model.number="pv.chatListMaxHeight" />
      <span class="val">{{ pv.chatListMaxHeight }}px</span>
    </div>

    <div class="row">
      <div class="lbl2">Padding</div>
      <input class="range" type="range" min="8" max="28" v-model.number="pv.chatListPadding" />
      <span class="val">{{ pv.chatListPadding }}px</span>
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
