
<template>
  <div class="p">
    <div class="row">
      <div class="lbl2">Theme</div>
      <select class="sel" v-model="theme" @change="applyTheme">
        <option v-for="t in themes" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <div class="row">
      <div class="lbl2">Mobile</div>
      <label class="chk"><input type="checkbox" v-model="isMobile" @change="applyMobile" /> isMobile</label>
    </div>

    <p class="hint">
      Preview에서 <b>실제 AppHeader</b>가 store를 직접 import하여 정상 동작하는지 확인하세요.
    </p>
  </div>
</template>

<script>
import { patchPreviewStore } from "@/stores/previewBridge";

export default {
  data() {
    return {
      themes: ["light","dim","dark","summer"],
      theme: "light",
      isMobile: false,
    };
  },
  methods: {
    applyTheme() {
      patchPreviewStore({ ui: { theme: this.theme } });
    },
    applyMobile() {
      patchPreviewStore({ ui: { isMobile: this.isMobile } });
    },
  },
  mounted() {
    // initial patch so preview matches UI
    this.applyTheme();
    this.applyMobile();
  }
};
</script>

<style scoped>
.p { display:flex; flex-direction: column; gap: 12px; }
.row { display:flex; align-items:center; gap: 10px; }
.lbl2 { width: 90px; font-size: 12px; color: var(--muted); }
.sel {
  flex:1; height: 34px; border-radius: 10px; border: 1px solid var(--border);
  background: transparent; color: var(--text); padding: 0 10px;
}
.chk { font-size: 12px; color: var(--text); display:flex; align-items:center; gap: 8px; }
.hint { margin: 0; font-size: 12px; color: var(--muted); line-height: 1.4; }
</style>
