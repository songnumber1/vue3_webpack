
<template>
  <div class="frame" :style="vars">
    <PreviewHeader v-if="pv.showHeader" :focused="pv.focus === 'header'" />
    <div class="body">
      <PreviewSidebar v-if="pv.showSidebar" :focused="pv.focus === 'sidebar'" />
      <div class="main" :class="{ focused: pv.focus === 'main' }">
        <div class="main-inner">
          <div class="main-title">Main Preview Area</div>
          <div class="main-desc">
            이 영역은 실제 앱의 router-view가 아니라, Playground 전용 preview 입니다.
          </div>

          <PreviewMessages :focused="pv.focus === 'messages'" />
          <PreviewInput :focused="pv.focus === 'input'" />
        </div>

        <PreviewFooter v-if="pv.showFooter" :focused="pv.focus === 'footer'" />
      </div>
    </div>
  </div>
</template>

<script>
import { useLayoutPreviewStore } from "@/stores/layoutPreviewStore";
import PreviewHeader from "./preview/PreviewHeader.vue";
import PreviewSidebar from "./preview/PreviewSidebar.vue";
import PreviewFooter from "./preview/PreviewFooter.vue";
import PreviewMessages from "./preview/PreviewMessages.vue";
import PreviewInput from "./preview/PreviewInput.vue";

export default {
  name: "LayoutPreviewFrame",
  components: { PreviewHeader, PreviewSidebar, PreviewFooter, PreviewMessages, PreviewInput },
  computed: {
    pv() { return useLayoutPreviewStore(); },
    vars() {
      const t = this.pv.theme;
      // map preview theme -> use existing theme tokens by wrapping with data-theme attr on frame
      // We'll set CSS variables here; base palette uses current app tokens (var(--bg), etc.)
      return {
        "--pv-header-h": this.pv.headerHeight + "px",
        "--pv-footer-h": this.pv.footerHeight + "px",
        "--pv-sidebar-w": this.pv.sidebarWidth + "px",
        "--pv-main-pad": this.pv.mainPadding + "px",
        "--pv-list-max": this.pv.chatListMaxHeight + "px",
        "--pv-list-pad": this.pv.chatListPadding + "px",
        "--pv-input-h": this.pv.inputHeight + "px",
        "data-theme": t,
      };
    }
  },
  watch: {
    "pv.theme": {
      immediate: true,
      handler(v) {
        // apply theme only to preview frame by setting attribute
        // (we cannot bind dataset via style; so we toggle attr on element in mounted+watch)
        if (this.$el) this.$el.setAttribute("data-theme", v);
      }
    }
  },
  mounted() {
    this.$el.setAttribute("data-theme", this.pv.theme);
  }
};
</script>

<style scoped>
.frame {
  height: 100%;
  min-height: 496px;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg);
}

.body { flex: 1; min-height: 0; display: flex; }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--bg); }
.main.focused { outline: 2px solid var(--primary); outline-offset: -2px; }

.main-inner {
  flex: 1;
  min-height: 0;
  padding: var(--pv-main-pad);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-title { font-weight: 800; color: var(--text); }
.main-desc { font-size: 12px; color: var(--muted); }
</style>
