
<template>
  <section class="lp">
    <div class="lp-top">
      <div class="lp-title">Layout Preview Playground</div>
      <div class="lp-sub">각 영역은 Preview 전용 store를 사용합니다 (실제 AppLayout은 영향 없음)</div>
    </div>

    <div class="lp-grid">
      <!-- Left: nested tabs -->
      <aside class="lp-left">
        <div class="lp-tabs">
          <button v-for="t in innerTabs" :key="t.key"
                  class="lp-tab" :class="{ active: active === t.key }"
                  @click="selectTab(t.key)">
            {{ t.label }}
          </button>
        </div>

        <div class="lp-panel">
          <component :is="activeComponent" />
        </div>
      </aside>

      <!-- Right: preview frame (separate from real layout) -->
      <div class="lp-right">
        <LayoutPreviewFrame />
      </div>
    </div>
  </section>
</template>

<script>
import { markRaw } from "vue";
import { useLayoutPreviewStore } from "@/stores/layoutPreviewStore";
import LayoutPreviewFrame from "./LayoutPreviewFrame.vue";

import HeaderPanel from "./panels/HeaderPanel.vue";
import SidebarPanel from "./panels/SidebarPanel.vue";
import MainPanel from "./panels/MainPanel.vue";
import MessagesPanel from "./panels/MessagesPanel.vue";
import InputPanel from "./panels/InputPanel.vue";
import FooterPanel from "./panels/FooterPanel.vue";

export default {
  name: "LayoutPlayground",
  components: { LayoutPreviewFrame },
  data() {
    return {
      active: "header",
      innerTabs: [
        { key: "header", label: "Header", component: markRaw(HeaderPanel) },
        { key: "sidebar", label: "Sidebar", component: markRaw(SidebarPanel) },
        { key: "main", label: "Main", component: markRaw(MainPanel) },
        { key: "messages", label: "ChatMessageList", component: markRaw(MessagesPanel) },
        { key: "input", label: "ChatInput", component: markRaw(InputPanel) },
        { key: "footer", label: "Footer", component: markRaw(FooterPanel) },
      ],
    };
  },
  computed: {
    activeComponent() {
      return this.innerTabs.find(t => t.key === this.active)?.component;
    },
    pv() {
      return useLayoutPreviewStore();
    }
  },
  created() {
    this.selectTab(this.active);
  },
  methods: {
    selectTab(key) {
      this.active = key;
      this.pv.setFocus(key);
    }
  }
};
</script>

<style scoped>
.lp { display: flex; flex-direction: column; gap: 12px; }
.lp-top { padding: 12px; border-radius: 12px; background: var(--card); border: 1px solid var(--border); }
.lp-title { font-size: 16px; font-weight: 800; color: var(--text); }
.lp-sub { margin-top: 4px; font-size: 12px; color: var(--muted); }

.lp-grid { display: grid; grid-template-columns: 380px 1fr; gap: 12px; min-height: 520px; }
@media (max-width: 980px) {
  .lp-grid { grid-template-columns: 1fr; }
}

.lp-left { border-radius: 12px; background: var(--card); border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; min-height: 520px; }
.lp-tabs { display:flex; flex-wrap: wrap; gap: 6px; padding: 10px; border-bottom: 1px solid var(--border); background: var(--card2); }
.lp-tab { padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text); font-size: 12px; cursor: pointer; }
.lp-tab.active { background: var(--chip); border-color: transparent; }
.lp-panel { padding: 12px; overflow: auto; flex: 1; }

.lp-right { border-radius: 12px; background: var(--card); border: 1px solid var(--border); padding: 12px; min-height: 520px; }
</style>
