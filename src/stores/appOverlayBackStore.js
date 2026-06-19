/**
 * @file stores/appOverlayBackStore.js
 * @description 모바일 fullscreen App Shell overlay의 브라우저 뒤로가기 1회 소비 상태를 관리합니다.
 */

import {defineStore} from "pinia";

export const useAppOverlayBackStore = defineStore("appOverlayBack", {
  state: () => ({
    activeOverlayType: null,
    mobileHistoryPushed: false,
    restoringMobileHistory: false,
    suppressNextChatRouteLoad: false,
    suppressNextChatRouteLoadId: null,
    suppressNextChatRouteLoadExpiresAt: 0,
  }),

  actions: {
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
