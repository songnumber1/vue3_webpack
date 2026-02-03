
<template>
  <div class="p">
    <div class="row">
      <label class="lbl"><input type="checkbox" v-model="pv.showHeader" /> Show header</label>
    </div>

    <div class="row">
      <div class="lbl2">Title</div>
      <input class="in" v-model="pv.headerTitle" />
    </div>

    <div class="row">
      <div class="lbl2">Height</div>
      <input class="range" type="range" min="40" max="88" v-model.number="pv.headerHeight" />
      <span class="val">{{ pv.headerHeight }}px</span>
    </div>

    <div class="row">
      <div class="lbl2">Theme (preview only)</div>
      <select class="sel" v-model="pv.theme">
        <option value="light">light</option>
        <option value="dark">dark</option>
        <option value="dim">dim</option>
        <option value="summer">summer</option>
      </select>
    </div>

    <p class="hint">
      이 설정은 Playground Preview에만 적용됩니다. 실제 AppHeader는 영향이 없습니다.
    </p>
  </div>
</template>

<script>
import { useLayoutPreviewStore } from "@/stores/layoutPreviewStore";
export default {
  computed: {
    pv() { return useLayoutPreviewStore(); }
  }
};
</script>

<style scoped>
.p { display:flex; flex-direction: column; gap: 10px; }
.row { display:flex; align-items:center; gap: 10px; }
.lbl { font-size: 13px; color: var(--text); }
.lbl2 { width: 110px; font-size: 12px; color: var(--muted); }
.in, .sel {
  flex:1;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  padding: 0 10px;
}
.range { flex:1; }
.val { width: 60px; font-size: 12px; color: var(--muted); text-align: right; }
.hint { margin: 0; font-size: 12px; color: var(--muted); }
</style>
