/**
 * @file composables/prompt/usePromptMenu.js
 * @description 프롬프트 입력 하위 메뉴 상태와 PC/모바일 메뉴 렌더링 모드를 관리합니다.
 */

import {computed, onBeforeUnmount, ref, watch} from "vue";
import {useEventListener} from "@vueuse/core";
import {useOutsideClick} from "@/composables/events/useOutsideClick";
import {PROMPT_MENU_TYPE} from "@/constants/promptComposer";
import {useResponsiveLayoutStore} from "@/stores/responsiveLayoutStore";
import {usePromptControlStore} from "@/stores/promptControlStore";

function createMenuOpenRef(scopeId, menuType) {
  const promptControlStore = usePromptControlStore();
  return computed({
    get: () => promptControlStore.isPromptMenuOpen(scopeId, menuType),
    set: (open) => {
      if (open) {
        promptControlStore.openPromptMenu(scopeId, menuType);
        return;
      }
      promptControlStore.closePromptMenu(scopeId, menuType);
    },
  });
}

export function usePromptMenu() {
  const responsiveLayoutStore = useResponsiveLayoutStore();
  const promptControlStore = usePromptControlStore();
  const promptMenuScopeId = `prompt-menu-${Math.random().toString(36).slice(2)}`;

  const toolbarRef = ref(null);
  const activeMenu = computed(() =>
    promptControlStore.getActivePromptMenu(promptMenuScopeId)
  );

  const modelMenuOpen = createMenuOpenRef(
    promptMenuScopeId,
    PROMPT_MENU_TYPE.model
  );
  const toolMenuOpen = createMenuOpenRef(
    promptMenuScopeId,
    PROMPT_MENU_TYPE.tool
  );
  const attachMenuOpen = createMenuOpenRef(
    promptMenuScopeId,
    PROMPT_MENU_TYPE.attach
  );

  // PromptComposer의 row/toolbar 분기는 앱 전체 레이아웃과 반드시 같은 기준을 써야 합니다.
  // useWindowSize/platformOverride/body class를 별도로 보면 PC<->모바일 왕복 시 composer만 stale 상태가 될 수 있습니다.
  const shouldUseMobileSheet = computed(() =>
    Boolean(responsiveLayoutStore.isMobile)
  );

  const isMobileSheet = computed(() => shouldUseMobileSheet.value);

  function syncPromptMenuClass() {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle(
      "is-prompt-menu-open",
      promptControlStore.hasAnyPromptMenuOpen
    );
  }

  function syncViewportMode() {
    promptControlStore.setPromptMobileSheet(
      promptMenuScopeId,
      shouldUseMobileSheet.value
    );
  }

  function closeMenus(except = "") {
    if (except && activeMenu.value === except) return;
    promptControlStore.closePromptMenu(promptMenuScopeId);
  }

  function openMenu(menuType) {
    promptControlStore.openPromptMenu(promptMenuScopeId, menuType);
  }

  function closeMenu(menuType) {
    promptControlStore.closePromptMenu(promptMenuScopeId, menuType);
  }

  function toggleMenu(menuType) {
    promptControlStore.togglePromptMenu(promptMenuScopeId, menuType);
  }

  function getToolbarRoot(key) {
    const root = toolbarRef.value?.[key];
    return root?.value || root || null;
  }

  useOutsideClick(
    [
      () => getToolbarRoot("modelRoot"),
      () => getToolbarRoot("toolRoot"),
      () => getToolbarRoot("attachRoot"),
    ],
    closeMenus,
    {shouldIgnore: () => isMobileSheet.value}
  );

  watch(() => promptControlStore.hasAnyPromptMenuOpen, syncPromptMenuClass, {
    immediate: true,
  });

  watch(
    () => [
      responsiveLayoutStore.isMobile,
      responsiveLayoutStore.effectiveWidth,
      responsiveLayoutStore.effectiveHeight,
    ],
    syncViewportMode,
    {immediate: true, flush: "post"}
  );

  if (typeof window !== "undefined") {
    useEventListener(window, "resize", syncViewportMode, {passive: true});
    useEventListener(window, "orientationchange", syncViewportMode, {
      passive: true,
    });
    if (window.visualViewport) {
      useEventListener(window.visualViewport, "resize", syncViewportMode, {
        passive: true,
      });
    }
  }

  onBeforeUnmount(() => {
    promptControlStore.clearPromptScope(promptMenuScopeId);
    syncPromptMenuClass();
  });

  return {
    toolbarRef,
    activeMenu,
    modelMenuOpen,
    toolMenuOpen,
    attachMenuOpen,
    isMobileSheet,
    syncViewportMode,
    closeMenus,
    openMenu,
    closeMenu,
    toggleMenu,
    getToolbarRoot,
  };
}
