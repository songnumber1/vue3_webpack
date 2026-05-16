/**
 * @file usePromptMenus.js
 * @description Model/tool/attachment menu state for PromptComposer.
 */

import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useOutsideClick} from '@/composables/useOutsideClick';

/** @returns {boolean} */
function detectMobileSheetMode() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.matchMedia?.('(max-width: 900px)')?.matches ||
      document.querySelector('.app-container--mobile')
  );
}

/**
 * @param {object} props Prompt props.
 * @param {Function} emit Prompt emit function.
 * @param {{text: import('vue').Ref<string>, focusTextarea: Function, resize: Function}} textarea Textarea controller.
 * @returns {object} Menu controller.
 */
export function usePromptMenus(props, emit, textarea) {
  const {t} = useI18n();
  const toolbarRef = ref(null);
  const attachMenuOpen = ref(false);
  const modelMenuOpen = ref(false);
  const toolMenuOpen = ref(false);
  const isMobileSheet = ref(false);

  const fallbackModels = [
    {id: props.modelValue, label: '빠른 모델', description: '현재 선택된 모델'},
  ];
  const currentModels = computed(() =>
    props.models.length ? props.models : fallbackModels
  );
  const currentModel = computed(
    () =>
      currentModels.value.find((model) => model.id === props.modelValue) ||
      currentModels.value[0]
  );
  /**
   * Returns DOM elements exposed from PromptActionToolbar. Vue may unwrap
   * exposed refs on the parent proxy, so support both HTMLElement and Ref shapes.
   * @param {'modelRoot'|'toolRoot'|'attachRoot'} key Exposed toolbar root key.
   * @returns {HTMLElement|null}
   */
  function getToolbarRoot(key) {
    const root = toolbarRef.value?.[key];
    return root?.value || root || null;
  }

  const tools = computed(() => [
    {
      id: 'image',
      icon: '▧',
      label: t('chat.suggestions.image'),
      prompt: '이미지 생성 프롬프트를 만들어줘',
    },
    {
      id: 'write',
      icon: '✎',
      label: t('chat.suggestions.writing'),
      prompt: '아래 내용을 더 자연스럽게 다듬어줘',
    },
    {
      id: 'find',
      icon: '◎',
      label: t('chat.suggestions.search'),
      prompt: '프로젝트에서 빠진 항목을 찾아줘',
    },
  ]);

  /** @returns {void} */
  function syncViewportMode() {
    isMobileSheet.value = detectMobileSheetMode();
  }

  /** @param {string} except Menu key to keep open. @returns {void} */
  function closeMenus(except = '') {
    if (except !== 'model') modelMenuOpen.value = false;
    if (except !== 'tool') toolMenuOpen.value = false;
    if (except !== 'attach') attachMenuOpen.value = false;
  }

  /** @returns {void} */
  function openModelSelector() {
    if (props.disabled || props.modelReadonly) return;
    syncViewportMode();
    const next = !modelMenuOpen.value;
    closeMenus('model');
    modelMenuOpen.value = next;
  }

  /** @returns {void} */
  function openToolSelector() {
    if (props.disabled) return;
    syncViewportMode();
    const next = !toolMenuOpen.value;
    closeMenus('tool');
    toolMenuOpen.value = next;
  }

  /** @returns {void} */
  function openAttachSelector() {
    if (props.disabled) return;
    syncViewportMode();
    const next = !attachMenuOpen.value;
    closeMenus('attach');
    attachMenuOpen.value = next;
  }

  /** @param {string} id Selected model id. @returns {void} */
  function selectModel(id) {
    emit('update:modelValue', id);
    modelMenuOpen.value = false;
  }

  /** @param {{prompt: string}} tool Tool option. @returns {void} */
  function applyTool(tool) {
    textarea.text.value = textarea.text.value
      ? `${textarea.text.value}\n${tool.prompt}`
      : tool.prompt;
    toolMenuOpen.value = false;
    textarea.focusTextarea();
    textarea.resize();
  }

  useOutsideClick(
    [
      () => getToolbarRoot('modelRoot'),
      () => getToolbarRoot('toolRoot'),
      () => getToolbarRoot('attachRoot'),
    ],
    closeMenus,
    {shouldIgnore: () => isMobileSheet.value}
  );

  onMounted(() => {
    syncViewportMode();
    window.addEventListener('resize', syncViewportMode, {passive: true});
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', syncViewportMode);
  });

  return {
    t,
    toolbarRef,
    attachMenuOpen,
    modelMenuOpen,
    toolMenuOpen,
    isMobileSheet,
    currentModels,
    currentModel,
    tools,
    syncViewportMode,
    closeMenus,
    openModelSelector,
    openToolSelector,
    openAttachSelector,
    selectModel,
    applyTool,
  };
}
