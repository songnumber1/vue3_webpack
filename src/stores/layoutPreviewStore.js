
import { defineStore } from "pinia";

// Preview-only layout store for Playground.
// It does NOT affect the real app layout (AppLayout).
export const useLayoutPreviewStore = defineStore("layoutPreview", {
  state: () => ({
    // visibility
    showHeader: true,
    showFooter: true,
    showSidebar: true,

    // sizes
    headerHeight: 56,
    footerHeight: 40,
    sidebarWidth: 240,

    // styling
    theme: "light", // light | dark | dim | summer (mapped to tokens)
    headerTitle: "Preview Header",
    footerText: "Preview Footer",
    sidebarTitle: "Preview Sidebar",

    // main/chat
    mainPadding: 16,
    chatListMaxHeight: 260,
    chatListPadding: 14,
    inputHeight: 44,

    // focus highlight (for tabs)
    focus: "header" // header|footer|sidebar|main|messages|input
  }),
  actions: {
    setFocus(key) { this.focus = key; },
    toggle(key) { this[key] = !this[key]; }
  }
});
