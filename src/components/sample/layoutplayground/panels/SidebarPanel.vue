
<template>
  <div class="p">
    <div class="row">
      <div class="lbl2">Mobile</div>
      <label class="chk"><input type="checkbox" v-model="isMobile" @change="apply" /> isMobile</label>
    </div>

    <div class="row">
      <div class="lbl2">Sidebar open</div>
      <label class="chk"><input type="checkbox" v-model="sidebarOpen" @change="apply" /> open</label>
    </div>

    <div class="row">
      <div class="lbl2">Collapsed</div>
      <label class="chk"><input type="checkbox" v-model="sidebarCollapsed" @change="apply" /> collapsed</label>
    </div>

    <div class="row">
      <div class="lbl2">Assistants</div>
      <label class="chk"><input type="checkbox" v-model="assistantsExpanded" @change="apply" /> expanded</label>
    </div>

    <p class="hint">Preview에서 <b>실제 AppSidebar</b>가 router + stores로 정상 동작하는지 확인하세요.</p>
  </div>
</template>

<script>
import { patchPreviewStore } from "@/stores/previewBridge";

export default {
  data() {
    return {
      isMobile: false,
      sidebarOpen: true,
      sidebarCollapsed: false,
      assistantsExpanded: true,
    };
  },
  methods: {
    apply() {
      patchPreviewStore({ ui: {
        isMobile: this.isMobile,
        sidebarOpen: this.sidebarOpen,
        sidebarCollapsed: this.sidebarCollapsed,
        assistantsExpanded: this.assistantsExpanded,
      }});
    },
  },
  mounted() {
    this.apply();
  }
};
</script>

<style scoped>
.p { display:flex; flex-direction: column; gap: 12px; }
.row { display:flex; align-items:center; gap: 10px; }
.lbl2 { width: 120px; font-size: 12px; color: var(--muted); }
.chk { font-size: 12px; color: var(--text); display:flex; align-items:center; gap: 8px; }
.hint { margin: 0; font-size: 12px; color: var(--muted); line-height: 1.4; }
</style>
