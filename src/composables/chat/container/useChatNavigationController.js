/**
 * @description 채팅 화면의 라우팅 기반 액션을 관리합니다.
 * @param {*} options - router, navigationStore 등 의존성입니다.
 * @returns {*} navigation action 모음입니다.
 */
export function useChatNavigationController(options) {
  const {
    router,
    navigationStore,
    isMobile,
    refreshViewport,
    mobileSettingsOpen,
    personalizationOpen,
    noticeOpen,
    languageSheetOpen,
    assistantSheetOpen,
  } = options;

  function openSwagger() {
    router.push('/swagger');
  }

  function openPlayground() {
    navigationStore.setDrawerOpen(false);
    router.push({name: 'playground'});
  }

  function openMobileDrawer() {
    const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
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
    router.push({name: 'guide'});
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
