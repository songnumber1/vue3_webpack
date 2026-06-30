/**
 * @file composables/prompt/usePromptMenu.js
 * @description 모바일 전용 프롬프트 하단 메뉴 상태를 관리합니다.
 */

import {computed, onBeforeUnmount, ref, watch} from "vue";
import {PROMPT_MENU_TYPE} from "@/constants/promptComposer";
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
  const promptControlStore = usePromptControlStore();
  const promptMenuScopeId = `prompt-menu-${Math.random().toString(36).slice(2)}`;

  const toolbarRef = ref(null);
  const isMobileSheet = computed(() => true);
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

  function syncPromptMenuClass() {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle(
      "is-prompt-menu-open",
      promptControlStore.hasAnyPromptMenuOpen
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

  watch(() => promptControlStore.hasAnyPromptMenuOpen, syncPromptMenuClass, {
    immediate: true,
  });

  promptControlStore.setPromptMobileSheet(promptMenuScopeId, true);

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
    closeMenus,
    openMenu,
    closeMenu,
    toggleMenu,
    getToolbarRoot,
  };
}
