import {nextTick} from "vue";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {logWarn} from "@/utils/logger";
import {authApiLive} from "@/api/live/authApi.live";
import {useAuthStore} from "@/stores/authStore";

export function useChatNavigationActions({
  router,
  theme,
  themeName,
  messages,
  isMobile,
  assistantSheetOpen,
  noticeOpen,
  privacyOpen,
  personalizationOpen,
  systemOpen,
  languageSheetOpen,
  mobileSettingsOpen,
  navigationStore,
  revokeMessageAttachments,
  clearCurrentChatSelection,
  selectAssistantForNewChat,
  refreshViewport,
  clearForceBottom,
  scrollBottom,
}) {
  async function resetChatState({assistantId = null} = {}) {
    revokeMessageAttachments(messages.value);
    messages.value = [];
    if (assistantId) {
      try {
        await selectAssistantForNewChat(assistantId);
      } catch (error) {
        logWarn(
          "[useChatNavigationActions] selectAssistantForNewChat 오류:",
          error
        );
      }
      assistantSheetOpen.value = false;
    } else {
      clearCurrentChatSelection();
    }
    navigationStore.closeTransientPanels();
    clearForceBottom();
    await router.push("/").catch(() => {});
  }

  function startNewChat() {
    return resetChatState();
  }

  function startNewChatWithAssistant(id) {
    return resetChatState({assistantId: id});
  }

  async function openHistory(item) {
    navigationStore.closeTransientPanels();
    await router.push({name: "chat", params: {id: item.id}}).catch(() => {});
  }

  async function toggleTheme() {
    try {
      theme.toggle();
      themeName.value = theme.current;
      await nextTick();
      await renderMermaidInElement(document.querySelector(".message-list"), {
        force: true,
      });
      scrollBottom({stable: true});
    } catch (error) {
      logWarn("[useChatNavigationActions] toggleTheme 오류:", error);
    }
  }

  function openSwagger() {
    router.push("/swagger").catch(() => {});
  }

  function openPlayground() {
    navigationStore.setDrawerOpen(false);
    router.push({name: "playground"}).catch(() => {});
  }

  function openMobileDrawer() {
    const activeElement =
      typeof document !== "undefined" ? document.activeElement : null;
    if (activeElement?.blur) activeElement.blur();
    navigationStore.setDrawerOpen(true);
    window.setTimeout(refreshViewport, 50);
    window.setTimeout(refreshViewport, 180);
  }

  function openSettings() {
    if (isMobile.value) {
      navigationStore.setDrawerOpen(false);
      mobileSettingsOpen.value = true;
      return;
    }
    openPersonalization();
  }

  function openGuide() {
    navigationStore.setDrawerOpen(false);
    router.push({name: "guide"}).catch(() => {});
  }

  function openNotice() {
    navigationStore.setDrawerOpen(false);
    noticeOpen.value = true;
  }

  function openPrivacy() {
    navigationStore.setDrawerOpen(false);
    privacyOpen.value = true;
  }

  function openTerms() {
    navigationStore.setDrawerOpen(false);
    router.push({name: "terms"}).catch(() => {});
  }

  function openPersonalization() {
    navigationStore.setDrawerOpen(false);
    personalizationOpen.value = true;
  }

  function openSystem() {
    navigationStore.setDrawerOpen(false);
    systemOpen.value = true;
  }

  function openLanguage() {
    languageSheetOpen.value = true;
  }

  async function logout() {
    try {
      await authApiLive.logout();
    } catch (error) {
      logWarn("[useChatNavigationActions] logout 오류:", error);
    } finally {
      useAuthStore().resetAuth();
      navigationStore.setDrawerOpen(false);
      await router.replace({name: "login-required", query: {reason: "LOGIN_REQUIRED"}}).catch(() => {});
    }
  }

  function openAssistantFromHeader() {
    assistantSheetOpen.value = true;
  }

  return {
    startNewChat,
    startNewChatWithAssistant,
    openHistory,
    toggleTheme,
    openSwagger,
    openPlayground,
    openMobileDrawer,
    openSettings,
    openGuide,
    openNotice,
    openPrivacy,
    openTerms,
    openPersonalization,
    openSystem,
    openLanguage,
    openAssistantFromHeader,
    logout,
  };
}
