import {ref, watch} from "vue";
import {useEventListener, useMediaQuery} from "@vueuse/core";
import {useOutsideClick} from "@/composables/useOutsideClick";
import {PROMPT_MENU_TYPE, PROMPT_VIEWPORT_QUERY} from "@/constants/promptComposer";

/**
 * @description 뷰포트 모드 감지와 메뉴 공통 상태를 관리합니다.
 * @returns {object} 뷰포트 상태, 메뉴 열기/닫기, 툴바 ref
 */
export function usePromptMenu() {
  const toolbarRef = ref(null);
  const modelMenuOpen = ref(false);
  const toolMenuOpen = ref(false);
  const attachMenuOpen = ref(false);
  const isMobileSheet = ref(false);
  const isPromptCompactViewport = useMediaQuery(PROMPT_VIEWPORT_QUERY);

  function syncViewportMode() {
    isMobileSheet.value = Boolean(isPromptCompactViewport.value);
  }

  function closeMenus(except = "") {
    if (except !== PROMPT_MENU_TYPE.model) modelMenuOpen.value = false;
    if (except !== PROMPT_MENU_TYPE.tool) toolMenuOpen.value = false;
    if (except !== PROMPT_MENU_TYPE.attach) attachMenuOpen.value = false;
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

  watch(isPromptCompactViewport, syncViewportMode);
  useEventListener(window, "resize", syncViewportMode, {passive: true});
  useEventListener(window, "orientationchange", syncViewportMode, {passive: true});
  if (typeof window !== "undefined" && window.visualViewport) {
    useEventListener(window.visualViewport, "resize", syncViewportMode, {passive: true});
    useEventListener(window.visualViewport, "scroll", syncViewportMode, {passive: true});
  }

  return {
    toolbarRef,
    modelMenuOpen,
    toolMenuOpen,
    attachMenuOpen,
    isMobileSheet,
    syncViewportMode,
    closeMenus,
    getToolbarRoot,
  };
}
