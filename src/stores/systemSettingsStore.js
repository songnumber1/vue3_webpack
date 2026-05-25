import {defineStore} from "pinia";
import {
  DEFAULT_SYSTEM_SETTINGS,
  normalizeSystemSettings,
} from "@/constants/systemSettings";
import {logPlatformDebug} from "@/platform/platformDebug";

export const useSystemSettingsStore = defineStore("systemSettings", {
  state: () => ({
    settings: {...DEFAULT_SYSTEM_SETTINGS},
    hydrated: false,
  }),
  getters: {
    useRealApi: (state) => state.settings.useRealApi,
    platformOverride: (state) => state.settings.platformOverride,
    mobileBreakpoint: (state) => state.settings.mobileBreakpoint,
    keyboardMode: (state) => state.settings.keyboardMode,
    useVirtualKeyboard: (state) => state.settings.useVirtualKeyboard,
    showVirtualKeyboardDebug: (state) =>
      state.settings.showVirtualKeyboardDebug,
    virtualKeyboardHeight: (state) => state.settings.virtualKeyboardHeight,
    bottomSheetMinHeight: (state) => state.settings.bottomSheetMinHeight,
    bottomSheetMaxHeight: (state) => state.settings.bottomSheetMaxHeight,
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
    abortChatOnMobileBackground: (state) =>
      state.settings.abortChatOnMobileBackground,
  },
  actions: {
    init() {
      this.settings = normalizeSystemSettings(this.settings);
      this.hydrated = true;
    },
    applySettings(nextSettings) {
      const previous = {...this.settings};
      this.settings = normalizeSystemSettings(nextSettings);
      this.hydrated = true;
      logPlatformDebug("settings.apply", {
        previous: {
          platformOverride: previous.platformOverride,
          mobileBreakpoint: previous.mobileBreakpoint,
        },
        next: {
          platformOverride: this.settings.platformOverride,
          mobileBreakpoint: this.settings.mobileBreakpoint,
        },
      });
    },
  },
});
