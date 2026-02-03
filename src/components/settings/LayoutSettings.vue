<!-- src/components/settings/LayoutSettings.vue -->
<template>
  <div class="panel">
    <section class="sec">
      <h3 class="h">Visibility</h3>
      <label class="row">
        <input type="checkbox" v-model="layout.showHeader" />
        <span>Header</span>
      </label>
      <label class="row">
        <input type="checkbox" v-model="layout.showSidebar" />
        <span>Left sidebar</span>
      </label>
      <label class="row">
        <input type="checkbox" v-model="layout.showFooter" />
        <span>Footer</span>
      </label>
    </section>

    <section class="sec">
      <h3 class="h">Theme</h3>
      <div class="themes">
        <button
          v-for="t in $theme.THEMES"
          :key="t"
          class="pill"
          :class="{ active: ui.theme === t }"
          @click="ui.setTheme(t)"
        >
          {{ t }}
        </button>
      </div>
      <p class="hint">
        Theme colors are driven by CSS variables (data-theme). You can extend palettes in
        <code>src/assets/themes/*.css</code>.
      </p>
    </section>

    <section class="sec">
      <h3 class="h">Layout sizes</h3>

      <div class="grid">
        <div class="field">
          <div class="label">Header height</div>
          <input type="range" min="44" max="80" v-model.number="layout.headerHeight" />
          <div class="val">{{ layout.headerHeight }}px</div>
        </div>

        <div class="field">
          <div class="label">Footer height</div>
          <input type="range" min="36" max="80" v-model.number="layout.footerHeight" />
          <div class="val">{{ layout.footerHeight }}px</div>
        </div>

        <div class="field">
          <div class="label">Sidebar width</div>
          <input type="range" min="220" max="420" v-model.number="layout.sidebarWidth" />
          <div class="val">{{ layout.sidebarWidth }}px</div>
        </div>

        <div class="field">
          <div class="label">Sidebar collapsed</div>
          <input type="range" min="56" max="120" v-model.number="layout.sidebarCollapsedWidth" />
          <div class="val">{{ layout.sidebarCollapsedWidth }}px</div>
        </div>
      </div>
    </section>

    <section class="sec">
      <h3 class="h">Chat view</h3>

      <div class="grid">
        <div class="field">
          <div class="label">Room header height</div>
          <input type="range" min="44" max="80" v-model.number="layout.roomHeaderHeight" />
          <div class="val">{{ layout.roomHeaderHeight }}px</div>
        </div>

        <div class="field">
          <div class="label">Messages padding</div>
          <input type="range" min="8" max="32" v-model.number="layout.messagesPadding" />
          <div class="val">{{ layout.messagesPadding }}px</div>
        </div>

        <div class="field">
          <div class="label">Textarea min height</div>
          <input type="range" min="44" max="120" v-model.number="layout.inputMinHeight" />
          <div class="val">{{ layout.inputMinHeight }}px</div>
        </div>

        <div class="field">
          <div class="label">Textarea max height</div>
          <input type="range" min="120" max="320" v-model.number="layout.inputMaxHeight" />
          <div class="val">{{ layout.inputMaxHeight }}px</div>
        </div>

        <div class="field">
          <div class="label">Bubble max width</div>
          <input type="range" min="420" max="980" v-model.number="layout.bubbleMaxWidth" />
          <div class="val">{{ layout.bubbleMaxWidth }}px</div>
        </div>

        <div class="field">
          <div class="label">Message font size</div>
          <input type="range" min="12" max="18" v-model.number="layout.messageFontSize" />
          <div class="val">{{ layout.messageFontSize }}px</div>
        </div>
      </div>
    </section>

    <section class="sec">
      <h3 class="h">Quick reset</h3>
      <div class="btns">
        <button class="btn" @click="resetLayout">Reset layout</button>
        <button class="btn danger" @click="resetAll">Reset layout + theme</button>
      </div>
    </section>
  </div>
</template>

<script>
import { useUiStore } from "@/stores/uiStore";
import { useLayoutStore } from "@/stores/layoutStore";

export default {
  name: "LayoutSettings",
  setup() {
    const ui = useUiStore();
    const layout = useLayoutStore();
    return { ui, layout };
  },
  methods: {
    resetLayout() {
      // hard defaults (match store defaults)
      this.layout.$patch({
        showHeader: true,
        showFooter: true,
        showSidebar: true,
        sidebarWidth: 280,
        sidebarCollapsedWidth: 76,
        headerHeight: 56,
        footerHeight: 44,
        roomHeaderHeight: 52,
        messagesPadding: 16,
        inputMinHeight: 56,
        inputMaxHeight: 180,
        bubbleMaxWidth: 720,
        messageFontSize: 14,
      });
    },
    resetAll() {
      this.resetLayout();
      this.ui.setTheme("light");
    },
  },
};
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: var(--text-primary);
}

.sec {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
}

.h {
  font-size: 13px;
  margin: 0 0 10px;
  color: var(--text-primary);
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  margin: 6px 0;
}

.themes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12px;
}

.pill:hover {
  background: var(--bg-soft);
}

.pill.active {
  background: var(--accent);
  border-color: transparent;
  color: var(--accent-contrast);
}

.hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.hint code {
  background: var(--code-bg);
  color: var(--code-text);
  padding: 2px 6px;
  border-radius: 8px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.field {
  display: grid;
  grid-template-columns: 130px 1fr 64px;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.label {
  color: var(--text-secondary);
}

.val {
  text-align: right;
  color: var(--text-muted);
}

input[type="range"] {
  width: 100%;
}

.btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12px;
}

.btn:hover {
  background: var(--bg-soft);
}

.btn.danger {
  background: var(--danger);
  border-color: transparent;
  color: var(--danger-contrast, #fff);
}
</style>
