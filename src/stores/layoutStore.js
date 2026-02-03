// src/stores/layoutStore.js
import { defineStore } from "pinia";

const LS_KEY = "ds_layout_v1";

function load() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function save(state) {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        showHeader: state.showHeader,
        showFooter: state.showFooter,
        showSidebar: state.showSidebar,
        sidebarWidth: state.sidebarWidth,
        sidebarCollapsedWidth: state.sidebarCollapsedWidth,
        headerHeight: state.headerHeight,
        footerHeight: state.footerHeight,
        roomHeaderHeight: state.roomHeaderHeight,
        messagesPadding: state.messagesPadding,
        inputMinHeight: state.inputMinHeight,
        inputMaxHeight: state.inputMaxHeight,
        bubbleMaxWidth: state.bubbleMaxWidth,
        messageFontSize: state.messageFontSize,
      })
    );
  } catch {
    // ignore
  }
}

export const useLayoutStore = defineStore("layout", {
  state: () => {
    const base = load();
    return {
      // visibility
      showHeader: base.showHeader !== undefined ? !!base.showHeader : true,
      showFooter: base.showFooter !== undefined ? !!base.showFooter : true,
      showSidebar: base.showSidebar !== undefined ? !!base.showSidebar : true,

      // layout sizes
      sidebarWidth: Number(base.sidebarWidth ?? 280),
      sidebarCollapsedWidth: Number(base.sidebarCollapsedWidth ?? 76),
      headerHeight: Number(base.headerHeight ?? 56),
      footerHeight: Number(base.footerHeight ?? 44),

      // chat view
      roomHeaderHeight: Number(base.roomHeaderHeight ?? 52),
      messagesPadding: Number(base.messagesPadding ?? 16),
      inputMinHeight: Number(base.inputMinHeight ?? 56),
      inputMaxHeight: Number(base.inputMaxHeight ?? 180),
      bubbleMaxWidth: Number(base.bubbleMaxWidth ?? 720),
      messageFontSize: Number(base.messageFontSize ?? 14),
    };
  },

  actions: {
    persist() {
      save(this);
    },

    clamp() {
      // simple clamps to keep UI usable
      this.sidebarWidth = Math.min(Math.max(this.sidebarWidth, 220), 420);
      this.sidebarCollapsedWidth = Math.min(Math.max(this.sidebarCollapsedWidth, 56), 120);
      this.headerHeight = Math.min(Math.max(this.headerHeight, 44), 80);
      this.footerHeight = Math.min(Math.max(this.footerHeight, 36), 80);
      this.roomHeaderHeight = Math.min(Math.max(this.roomHeaderHeight, 44), 80);
      this.messagesPadding = Math.min(Math.max(this.messagesPadding, 8), 32);
      this.inputMinHeight = Math.min(Math.max(this.inputMinHeight, 44), 120);
      this.inputMaxHeight = Math.min(Math.max(this.inputMaxHeight, this.inputMinHeight + 40), 320);
      this.bubbleMaxWidth = Math.min(Math.max(this.bubbleMaxWidth, 420), 980);
      this.messageFontSize = Math.min(Math.max(this.messageFontSize, 12), 18);
    },
  },
});
