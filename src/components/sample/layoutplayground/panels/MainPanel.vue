<template>
  <div class="p">
    <div class="row">
      <div class="lbl2">Main padding</div>
      <input class="range" type="range" min="8" max="32" v-model.number="pv.mainPadding" />
      <span class="val">{{ pv.mainPadding }}px</span>
    </div>
    <p class="hint">Main 영역은 PreviewFrame의 router-view 대체 영역입니다.</p>
  </div>
</template>

<script>
import { useLayoutPreviewStore } from "@/stores/layoutPreviewStore";
export default { computed: { pv() { return useLayoutPreviewStore(); } } };
</script>

<style scoped>
.p {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.lbl2 {
  width: 110px;
  font-size: 12px;
  color: var(--muted);
}

.range {
  flex: 1;
}

.val {
  width: 60px;
  font-size: 12px;
  color: var(--muted);
  text-align: right;
}

.hint {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}
</style>
