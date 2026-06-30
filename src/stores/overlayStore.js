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
    return;
  }

  delete body.dataset.activeOverlay;
  delete body.dataset.activeOverlayKind;
  delete body.dataset.activeOverlayMode;
}

export const useOverlayStore = defineStore("overlay", {
  state: () => ({
    activeOverlays: new Map(),
    activeOverlayType: null,
    mobileHistoryPushed: false,
    restoringMobileHistory: false,
    suppressNextChatRouteLoad: false,
    suppressNextChatRouteLoadId: null,
    suppressNextChatRouteLoadExpiresAt: 0,
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
    registerOverlay(id, kind = DEFAULT_OVERLAY_KIND, mode = "default") {
      if (!id) return;
      this.activeOverlays.set(id, {id, kind, mode, openedAt: Date.now()});
      applyBodyOverlayState(this.activeOverlays);
    },

    unregisterOverlay(id) {
      if (!id) return;
      this.activeOverlays.delete(id);
      applyBodyOverlayState(this.activeOverlays);
    },


    setActiveOverlayType(type) {
      this.activeOverlayType = type || null;
    },

    markMobileHistoryPushed(type) {
      this.activeOverlayType = type || this.activeOverlayType || null;
      this.mobileHistoryPushed = true;
    },

    clearMobileHistoryPushed() {
      this.mobileHistoryPushed = false;
    },

    markRestoringMobileHistory() {
      this.restoringMobileHistory = true;
    },

    clearRestoringMobileHistory() {
      this.restoringMobileHistory = false;
    },

    markSuppressNextChatRouteLoad(chatId = null) {
      this.suppressNextChatRouteLoad = true;
      this.suppressNextChatRouteLoadId = chatId ? String(chatId) : null;
      this.suppressNextChatRouteLoadExpiresAt = Date.now() + 800;
    },

    shouldSuppressChatRouteLoad(chatId = null) {
      if (this.mobileHistoryPushed || this.restoringMobileHistory) return true;
      if (!this.suppressNextChatRouteLoad) return false;

      if (Date.now() > this.suppressNextChatRouteLoadExpiresAt) {
        this.clearSuppressNextChatRouteLoad();
        return false;
      }

      const currentChatId = chatId ? String(chatId) : null;
      const suppressedChatId = this.suppressNextChatRouteLoadId;

      if (suppressedChatId && currentChatId !== suppressedChatId) {
        this.clearSuppressNextChatRouteLoad();
        return false;
      }

      return Boolean(currentChatId || !suppressedChatId);
    },

    consumeSuppressNextChatRouteLoad(chatId = null) {
      if (!this.shouldSuppressChatRouteLoad(chatId)) return false;

      if (this.suppressNextChatRouteLoad) {
        this.clearSuppressNextChatRouteLoad();
      }
      return true;
    },

    clearSuppressNextChatRouteLoad() {
      this.suppressNextChatRouteLoad = false;
      this.suppressNextChatRouteLoadId = null;
      this.suppressNextChatRouteLoadExpiresAt = 0;
    },

    clearOverlayBackState() {
      this.activeOverlayType = null;
      this.mobileHistoryPushed = false;
      this.restoringMobileHistory = false;
    },
  },
});
