import {nextTick} from 'vue';
import {renderMermaidInElement} from '@/utils/mermaidRenderer';

export function useChatNavigationActions({
  router,
  navigationStore,
  theme,
  themeName,
  isMobile,
  refreshViewport,
  overlayKeys,
  openOverlay,
  closeOverlay,
  resetChatState,
  clearCurrentChatSelection,
  selectAssistantForNewChat,
}) {
  async function startNewChat() {
    resetChatState();
    clearCurrentChatSelection();
    await router.push('/');
  }

  async function startNewChatWithAssistant(id) {
    resetChatState();
    await selectAssistantForNewChat(id);
    closeOverlay(overlayKeys.ASSISTANT_SHEET);
    await router.push('/');
  }

  async function openHistory(item) {
    navigationStore.closeTransientPanels();
    await router.push({name: 'chat', params: {id: item.id}});
  }

  async function toggleTheme() {
    theme.toggle();
    themeName.value = theme.current;
    await nextTick();
    await renderMermaidInElement(document.querySelector('.message-list'), {
      force: true,
    });
  }

  function openSwagger() {
    router.push('/swagger');
  }

  function openPlayground() {
    navigationStore.setDrawerOpen(false);
    router.push({name: 'playground'});
  }

  function openMobileDrawer() {
    const activeElement =
      typeof document !== 'undefined' ? document.activeElement : null;
    if (activeElement?.blur) activeElement.blur();
    navigationStore.setDrawerOpen(true);
    window.setTimeout(refreshViewport, 50);
    window.setTimeout(refreshViewport, 180);
  }

  function openSettings() {
    if (isMobile.value) {
      navigationStore.setDrawerOpen(false);
      openOverlay(overlayKeys.MOBILE_SETTINGS);
      return;
    }
    openPersonalization();
  }

  function openGuide() {
    navigationStore.setDrawerOpen(false);
    router.push({name: 'guide'});
  }

  function openNotice() {
    navigationStore.setDrawerOpen(false);
    openOverlay(overlayKeys.NOTICE);
  }

  function openPersonalization() {
    navigationStore.setDrawerOpen(false);
    openOverlay(overlayKeys.PERSONALIZATION);
  }

  function openLanguage() {
    openOverlay(overlayKeys.LANGUAGE);
  }

  function openAssistantFromHeader() {
    openOverlay(overlayKeys.ASSISTANT_SHEET);
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
    selectAssistantFromSheet: startNewChatWithAssistant,
  };
}
