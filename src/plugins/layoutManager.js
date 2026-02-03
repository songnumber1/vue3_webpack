// src/plugins/layoutManager.js
import { watchEffect } from "vue";
import { useLayoutStore } from "@/stores/layoutStore";

/**
 * Layout Manager
 * - Applies layout store values into CSS variables (theme-friendly).
 * - Keeps all layout components DI-free (they just use CSS vars + store for behavior).
 */
export default {
  install(app) {
    // Expose helper (optional)
    app.config.globalProperties.$layout = {
      apply() {
        const ls = useLayoutStore();
        applyLayoutVars(ls);
      },
    };

    // reactive apply (auto)
    watchEffect(() => {
      const ls = useLayoutStore();
      ls.clamp();
      applyLayoutVars(ls);
      ls.persist();
    });
  },
};

function setVar(name, value) {
  document.documentElement.style.setProperty(name, String(value));
}

function applyLayoutVars(ls) {
  // visibility (used by layout via v-if, but also in CSS for spacing)
  setVar("--layout-show-header", ls.showHeader ? "1" : "0");
  setVar("--layout-show-footer", ls.showFooter ? "1" : "0");
  setVar("--layout-show-sidebar", ls.showSidebar ? "1" : "0");

  // sizes
  setVar("--header-height", (ls.showHeader ? ls.headerHeight : 0) + "px");
  setVar("--footer-height", (ls.showFooter ? ls.footerHeight : 0) + "px");
  setVar("--sidebar-width", (ls.showSidebar ? ls.sidebarWidth : 0) + "px");
  setVar("--sidebar-collapsed-width", (ls.showSidebar ? ls.sidebarCollapsedWidth : 0) + "px");

  // chat view sizing
  setVar("--room-header-height", ls.roomHeaderHeight + "px");
  setVar("--messages-padding", ls.messagesPadding + "px");
  setVar("--input-min-height", ls.inputMinHeight + "px");
  setVar("--input-max-height", ls.inputMaxHeight + "px");
  setVar("--bubble-max-width", ls.bubbleMaxWidth + "px");
  setVar("--message-font-size", ls.messageFontSize + "px");
}
