/**
 * @file composables/chat/header/useChatHeaderActions.js
 * @description ChatHeader에서 필요한 header action만 제공합니다.
 * ChatHeader가 provider key를 직접 알지 않도록 중간 계층을 둡니다.
 */

import {useNavigationStore} from "@/stores/navigationStore";
import {useViewportStore} from "@/stores/viewportStore";
import {useAppShellLock} from "@/composables/app/useAppShellLock";
import {useChatAssistantSheetState} from "@/composables/chat/header/useChatAssistantSheetState";
import {useResponseOverlay} from "@/composables/overlay/useResponseOverlay";

export function useChatHeaderActions() {
  const navigationStore = useNavigationStore();
  const viewportStore = useViewportStore();
  const responseOverlay = useResponseOverlay();
  const {isAppShellActionBlocked} = useAppShellLock();
  const {openAssistantSheet} = useChatAssistantSheetState();

  function refreshViewportSoon() {
    if (typeof window === "undefined") return;
    window.setTimeout(() => viewportStore.refresh(), 50);
    window.setTimeout(() => viewportStore.refresh(), 180);
  }

  function openDrawer() {
    if (isAppShellActionBlocked.value) return;
    const activeElement =
      typeof document !== "undefined" ? document.activeElement : null;
    if (activeElement?.blur) activeElement.blur();
    navigationStore.setDrawerOpen(true);
    refreshViewportSoon();
  }

  function openAssistant() {
    if (isAppShellActionBlocked.value) return;
    openAssistantSheet();
  }

  function openSettings() {
    responseOverlay.openSettings();
  }

  return {
    openDrawer,
    openAssistant,
    openSettings,
  };
}
