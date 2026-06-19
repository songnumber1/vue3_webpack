/**
 * @file composables/app/useAppShellActions.js
 * @description 앱 shell 전역 action을 제공합니다. UI 출력은 변경하지 않고 ChatContainer 중심 의존을 줄이기 위한 action 계층입니다.
 */

import {useAppShellLock} from "@/composables/app/useAppShellLock";
import {createAppShellActionHandlers} from "@/composables/app/createAppShellActionHandlers";

export function useAppShellActions({
  router,
  theme,
  themeName,
  isMobile,
  navigationStore,
  noticeOpen,
  privacyOpen,
  personalizationOpen,
  systemOpen,
  languageSheetOpen,
  mobileSettingsOpen,
  scrollBottom,
}) {
  const {isAppShellActionBlocked} = useAppShellLock();

  return createAppShellActionHandlers({
    router,
    theme,
    themeName,
    isMobile,
    navigationStore,
    noticeOpen,
    privacyOpen,
    personalizationOpen,
    systemOpen,
    languageSheetOpen,
    mobileSettingsOpen,
    scrollBottom,
    isBlocked: () => isAppShellActionBlocked.value,
    logScope: "useAppShellActions",
  });
}
