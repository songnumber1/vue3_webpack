
<template>
  <section class="lp">
    <div class="lp-top">
      <div class="lp-title">Layout Preview Playground (Real Components)</div>
      <div class="lp-sub">
        각 탭은 <b>실제 컴포넌트</b>를 <b>별도의 Pinia/Router(메모리)</b>로 마운트합니다.
        따라서 <b>DI(Props/Inject) 없이</b> 컴포넌트가 스스로 store를 가져와 동작하는지 확인할 수 있습니다.
      </div>
    </div>

    <div class="lp-grid">
      <!-- Left: tabs + options -->
      <aside class="lp-left">
        <div class="lp-tabs">
          <button v-for="t in tabs" :key="t.key"
                  class="lp-tab" :class="{ active: active === t.key }"
                  @click="active = t.key">
            {{ t.label }}
          </button>
        </div>

        <div class="lp-panel">
          <component :is="activePanel" />
          <div class="lp-note">
            ✅ 이 옵션들은 <b>Preview sub-app</b> 내부 store만 변경합니다.<br />
            ✅ 실제 AppLayout 화면에는 영향이 없습니다.
          </div>
        </div>
      </aside>

      <!-- Right: real component preview -->
      <div class="lp-right">
        <RealPreviewHost :previewComponent="activeComponent" :mode="previewMode" />
      </div>
    </div>
  </section>
</template>

<script>
import { markRaw, defineComponent, h } from "vue";

const StubMain = defineComponent({ name: "StubMain", render: () => h("div", { style: "padding:12px;color:var(--muted);font-size:12px;" }, "Main preview: 실제 앱에서는 router-view 영역입니다. (탭에서 다른 컴포넌트 DI 검증에 집중)") });

import RealPreviewHost from "./RealPreviewHost.vue";

// ✅ REAL components
import AppHeader from "@/components/layout/AppHeader.vue";
import AppFooter from "@/components/layout/AppFooter.vue";
import AppSidebar from "@/components/layout/AppSidebar.vue";
import ChatMessageList from "@/components/chat/ChatMessageList.vue";
import InputHeader from "@/components/chat/InputHeader.vue";

// Panels (preview-store editor)
import HeaderPanel from "./panels/HeaderPanel.vue";
import FooterPanel from "./panels/FooterPanel.vue";
import SidebarPanel from "./panels/SidebarPanel.vue";
import MessagesPanel from "./panels/MessagesPanel.vue";
import InputPanel from "./panels/InputPanel.vue";
import MainPanel from "./panels/MainPanel.vue";

export default {
  name: "LayoutPlayground",
  components: { RealPreviewHost },
  data() {
    return {
      active: "header",
      tabs: [
        { key: "header", label: "Header", component: markRaw(AppHeader), panel: markRaw(HeaderPanel), mode: "block" },
        { key: "sidebar", label: "Sidebar", component: markRaw(AppSidebar), panel: markRaw(SidebarPanel), mode: "block" },
        { key: "main", label: "Main", component: markRaw(StubMain), panel: markRaw(MainPanel), mode: "block" },
        { key: "messages", label: "ChatMessageList", component: markRaw(ChatMessageList), panel: markRaw(MessagesPanel), mode: "block" },
        { key: "input", label: "ChatInput", component: markRaw(InputHeader), panel: markRaw(InputPanel), mode: "block" },
        { key: "footer", label: "Footer", component: markRaw(AppFooter), panel: markRaw(FooterPanel), mode: "block" },
      ],
    };
  },
  computed: {
    activeRow() {
      return this.tabs.find(t => t.key === this.active) || this.tabs[0];
    },
    activeComponent() {
      return this.activeRow.component;
    },
    activePanel() {
      return this.activeRow.panel;
    },
    previewMode() {
      return this.activeRow.mode || "block";
    }
  }
};
</script>

<style scoped>
.lp { display: flex; flex-direction: column; gap: 12px; }
.lp-top { padding: 12px; border-radius: 12px; background: var(--card); border: 1px solid var(--border); }
.lp-title { font-size: 16px; font-weight: 900; color: var(--text); }
.lp-sub { margin-top: 6px; font-size: 12px; color: var(--muted); line-height: 1.4; }

.lp-grid { display: grid; grid-template-columns: 420px 1fr; gap: 12px; min-height: 560px; }
@media (max-width: 980px) { .lp-grid { grid-template-columns: 1fr; } }

.lp-left { border-radius: 12px; background: var(--card); border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; min-height: 560px; }
.lp-tabs { display:flex; flex-wrap: wrap; gap: 6px; padding: 10px; border-bottom: 1px solid var(--border); background: var(--card2); }
.lp-tab { padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text); font-size: 12px; cursor: pointer; }
.lp-tab.active { background: var(--chip); border-color: transparent; }
.lp-panel { padding: 12px; overflow: auto; flex: 1; display:flex; flex-direction: column; gap: 12px; }
.lp-note { font-size: 12px; color: var(--muted); border-top: 1px dashed var(--border); padding-top: 10px; }

.lp-right { border-radius: 12px; background: var(--card); border: 1px solid var(--border); padding: 12px; min-height: 560px; }
</style>
