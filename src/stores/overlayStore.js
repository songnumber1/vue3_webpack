import {defineStore} from "pinia";

const BODY_OVERLAY_CLASS = "app-has-overlay";
const DEFAULT_OVERLAY_KIND = "overlay";

function applyBodyOverlayState(activeOverlays) {
  if (typeof document === "undefined") return;
  const {body} = document;
  if (!body) return;

  const entries = Array.from(activeOverlays.values());
  const topEntry = entries[entries.length - 1] || null;

  body.classList.toggle(BODY_OVERLAY_CLASS, entries.length > 0);
  body.dataset.overlayCount = String(entries.length);

  if (topEntry) {
    body.dataset.activeOverlay = topEntry.id;
    body.dataset.activeOverlayKind = topEntry.kind;
    body.dataset.activeOverlayMode = topEntry.mode || "default";
  } else {
    delete body.dataset.activeOverlay;
    delete body.dataset.activeOverlayKind;
    delete body.dataset.activeOverlayMode;
  }
}

/**
 * Central registry for transient UI layers.
 *
 * The store deliberately does not own component open/close booleans yet. It
 * records the currently mounted overlays so CSS/body state, escape handling and
 * future z-index audits can be centralized without changing existing UI flows.
 */
export const useOverlayStore = defineStore("overlay", {
  state: () => ({
    activeOverlays: new Map(),
  }),
  getters: {
    activeCount: (state) => state.activeOverlays.size,
    hasActiveOverlay: (state) => state.activeOverlays.size > 0,
    topOverlay: (state) => {
      const entries = Array.from(state.activeOverlays.values());
      return entries[entries.length - 1] || null;
    },
  },
  actions: {
    registerOverlay({id, kind = DEFAULT_OVERLAY_KIND, mode = "default"} = {}) {
      if (!id) return;
      this.activeOverlays.set(id, {id, kind, mode, openedAt: Date.now()});
      applyBodyOverlayState(this.activeOverlays);
    },
    unregisterOverlay(id) {
      if (!id) return;
      this.activeOverlays.delete(id);
      applyBodyOverlayState(this.activeOverlays);
    },
    clearOverlays() {
      this.activeOverlays.clear();
      applyBodyOverlayState(this.activeOverlays);
    },
  },
});
