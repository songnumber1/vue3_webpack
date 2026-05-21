import {nextTick} from "vue";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {logWarn} from "@/utils/logger";
import {authApiLive} from "@/api/live/authApi.live";
import {useAuthStore} from "@/stores/authStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";

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
  const chatStreamStore = useChatStreamStore();

  function isBlockedByStream() {
    return chatStreamStore.isStreaming;
  }

  async function resetChatState({assistantId = null} = {}) {
    if (isBlockedByStream()) return;
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
    await router.push({name: "main"}).catch(() => {});
  }

  function startNewChat() {
    return resetChatState();
  }

  function startNewChatWithAssistant(id) {
    return resetChatState({assistantId: id});
  }

  async function openHistory(item) {
    if (isBlockedByStream()) return;
    navigationStore.closeTransientPanels();
    await router.push({name: "chat", params: {id: item.id}}).catch(() => {});
  }

  async function toggleTheme() {
    if (isBlockedByStream()) return;
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
    if (isBlockedByStream()) return;
    router.push("/swagger").catch(() => {});
  }

  function openPlayground() {
    if (isBlockedByStream()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: "playground"}).catch(() => {});
  }

  function openMobileDrawer() {
    if (isBlockedByStream()) return;
    const activeElement =
      typeof document !== "undefined" ? document.activeElement : null;
    if (activeElement?.blur) activeElement.blur();
    navigationStore.setDrawerOpen(true);
    window.setTimeout(refreshViewport, 50);
    window.setTimeout(refreshViewport, 180);
  }

  function openSettings() {
    if (isBlockedByStream()) return;
    if (isMobile.value) {
      navigationStore.setDrawerOpen(false);
      mobileSettingsOpen.value = true;
      return;
    }
    openPersonalization();
  }

  function openGuide() {
    if (isBlockedByStream()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: "guide"}).catch(() => {});
  }

  function openNotice() {
    if (isBlockedByStream()) return;
    navigationStore.setDrawerOpen(false);
    noticeOpen.value = true;
  }

  function openPrivacy() {
    if (isBlockedByStream()) return;
    navigationStore.setDrawerOpen(false);
    privacyOpen.value = true;
  }

  function openTerms() {
    if (isBlockedByStream()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: "terms"}).catch(() => {});
  }

  function openPersonalization() {
    if (isBlockedByStream()) return;
    navigationStore.setDrawerOpen(false);
    personalizationOpen.value = true;
  }

  function openSystem() {
    if (isBlockedByStream()) return;
    navigationStore.setDrawerOpen(false);
    systemOpen.value = true;
  }

  function openLanguage() {
    if (isBlockedByStream()) return;
    languageSheetOpen.value = true;
  }

  async function logout() {
    if (isBlockedByStream()) return;
    try {
      await authApiLive.logout();
    } catch (error) {
      logWarn("[useChatNavigationActions] logout 오류:", error);
    } finally {
      useAuthStore().resetAuth();
      navigationStore.setDrawerOpen(false);
      await router
        .replace({name: "login-required", query: {reason: "LOGIN_REQUIRED"}})
        .catch(() => {});
    }
  }

  function openAssistantFromHeader() {
    if (isBlockedByStream()) return;
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
