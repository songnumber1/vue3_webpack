import {defineStore} from "pinia";
import {
  DEFAULT_SYSTEM_SETTINGS,
  normalizeSystemSettings,
} from "@/constants/systemSettings";

export const useSystemSettingsStore = defineStore("systemSettings", {
  state: () => ({
    settings: {...DEFAULT_SYSTEM_SETTINGS},
    hydrated: false,
  }),
  getters: {
    useRealApi: (state) => state.settings.useRealApi,
    mobileBreakpoint: (state) => state.settings.mobileBreakpoint,
    keyboardMode: (state) => state.settings.keyboardMode,
    useVirtualKeyboard: (state) => state.settings.useVirtualKeyboard,
    showVirtualKeyboardDebug: (state) =>
      state.settings.showVirtualKeyboardDebug,
    useMicrophone: (state) => state.settings.useMicrophone,
    showGuideButton: (state) => state.settings.showGuideButton,
    showThemeButton: (state) => state.settings.showThemeButton,
    showSwaggerButton: (state) => state.settings.showSwaggerButton,
    showNoticeMenu: (state) => state.settings.showNoticeMenu,
    showPrivacyMenu: (state) => state.settings.showPrivacyMenu,
    showTermsMenu: (state) => state.settings.showTermsMenu,
    showPersonalizationMenu: (state) => state.settings.showPersonalizationMenu,
    showPlaygroundMenu: (state) => state.settings.showPlaygroundMenu,
    showLogoutButton: (state) => state.settings.showLogoutButton,
    showMobileApiProgress: (state) => state.settings.showMobileApiProgress,
    autoScrollOnAnswer: (state) => state.settings.autoScrollOnAnswer,
  },
  actions: {
    hydrate() {
      this.settings = normalizeSystemSettings(this.settings);
      this.hydrated = true;
    },
    applySettings(nextSettings) {
      this.settings = normalizeSystemSettings(nextSettings);
      this.hydrated = true;
    },
  },
});
