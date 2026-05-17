import {nextTick} from "vue";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";

export function useChatNavigationActions({
  router,
  theme,
  themeName,
  messages,
  isMobile,
  assistantSheetOpen,
  noticeOpen,
  personalizationOpen,
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
      await selectAssistantForNewChat(assistantId);
      assistantSheetOpen.value = false;
    } else {
      clearCurrentChatSelection();
    }
    navigationStore.closeTransientPanels();
    clearForceBottom();
    await router.push("/");
  }

  function startNewChat() {
    return resetChatState();
  }

  function startNewChatWithAssistant(id) {
    return resetChatState({assistantId: id});
  }

  async function openHistory(item) {
    navigationStore.closeTransientPanels();
    await router.push({name: "chat", params: {id: item.id}});
  }

  async function toggleTheme() {
    theme.toggle();
    themeName.value = theme.current;
    await nextTick();
    await renderMermaidInElement(document.querySelector(".message-list"), {
      force: true,
    });
    scrollBottom({stable: true});
  }

  function openSwagger() {
    router.push("/swagger");
  }

  function openPlayground() {
    navigationStore.setDrawerOpen(false);
    router.push({name: "playground"});
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
    router.push({name: "guide"});
  }

  function openNotice() {
    navigationStore.setDrawerOpen(false);
    noticeOpen.value = true;
  }

  function openPersonalization() {
    navigationStore.setDrawerOpen(false);
    personalizationOpen.value = true;
  }

  function openLanguage() {
    languageSheetOpen.value = true;
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
    openPersonalization,
    openLanguage,
    openAssistantFromHeader,
  };
}
