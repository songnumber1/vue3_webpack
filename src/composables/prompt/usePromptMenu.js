import {computed, onBeforeUnmount, ref, watch} from "vue";
import {useEventListener, useWindowSize} from "@vueuse/core";
import {useOutsideClick} from "@/composables/useOutsideClick";
import {PROMPT_MENU_TYPE} from "@/constants/promptComposer";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";

function createMenuOpenRef(activeMenu, menuType) {
  return computed({
    get: () => activeMenu.value === menuType,
    set: (open) => {
      if (open) {
        activeMenu.value = menuType;
        return;
      }
      if (activeMenu.value === menuType) activeMenu.value = null;
    },
  });
}

/**
 * @description 뷰포트 모드 감지와 메뉴 공통 상태를 관리합니다.
 * @returns {object} 뷰포트 상태, 메뉴 열기/닫기, 툴바 ref
 */
export function usePromptMenu() {
  const toolbarRef = ref(null);
  const activeMenu = ref(null);
  const modelMenuOpen = createMenuOpenRef(activeMenu, PROMPT_MENU_TYPE.model);
  const toolMenuOpen = createMenuOpenRef(activeMenu, PROMPT_MENU_TYPE.tool);
  const attachMenuOpen = createMenuOpenRef(activeMenu, PROMPT_MENU_TYPE.attach);
  const isMobileSheet = ref(false);
  const systemSettingsStore = useSystemSettingsStore();
  const {width} = useWindowSize();
  const isPromptCompactViewport = computed(
    () => width.value <= systemSettingsStore.mobileBreakpoint
  );

  function syncPromptMenuClass() {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle(
      "is-prompt-menu-open",
      Boolean(activeMenu.value)
    );
  }


  function syncViewportMode() {
    isMobileSheet.value = Boolean(isPromptCompactViewport.value);
  }

  function closeMenus(except = "") {
    if (except && activeMenu.value === except) return;
    activeMenu.value = null;
  }

  function openMenu(menuType) {
    activeMenu.value = menuType;
  }

  function closeMenu(menuType) {
    if (!menuType || activeMenu.value === menuType) activeMenu.value = null;
  }

  function toggleMenu(menuType) {
    activeMenu.value = activeMenu.value === menuType ? null : menuType;
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

  watch(activeMenu, syncPromptMenuClass, {immediate: true});
  onBeforeUnmount(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("is-prompt-menu-open");
    }
  });

  watch(isPromptCompactViewport, syncViewportMode);
  useEventListener(window, "resize", syncViewportMode, {passive: true});
  useEventListener(window, "orientationchange", syncViewportMode, {
    passive: true,
  });
  if (typeof window !== "undefined" && window.visualViewport) {
    useEventListener(window.visualViewport, "resize", syncViewportMode, {
      passive: true,
    });
    useEventListener(window.visualViewport, "scroll", syncViewportMode, {
      passive: true,
    });
  }

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
