import {computed, nextTick, onBeforeUnmount, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {usePlatformStore} from '@/stores/platformStore';
import {openNativeFilePicker} from '@/services/platformBridge';
import {
  createBrowserAttachment,
  createNativeAttachment,
  hydrateImageAttachment,
  revokeAttachmentUrl,
} from '@/utils/attachment';
import {useOutsideClick} from '@/composables/useOutsideClick';
import {logWarn} from '@/utils/logger';

/**
 * Creates prompt composer state and event handlers.
 * @param {object} props Component props.
 * @param {Function} emit Component emit function.
 * @returns {object} Prompt composer controller API.
 */
export function usePromptComposer(props, emit) {
  const {t} = useI18n();
  const platformStore = usePlatformStore();
  const text = ref('');
  const textareaComponentRef = ref(null);
  const toolbarRef = ref(null);
  const fileInputRef = ref(null);
  const attachments = ref([]);
  const attachMenuOpen = ref(false);
  const modelMenuOpen = ref(false);
  const toolMenuOpen = ref(false);
  const fileAccept = ref('');
  const captureMode = ref(null);
  const isMobileSheet = ref(false);
  let lastHeight = 0;
  let removeViewportListener = null;

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
  const canSubmit = computed(
    () => text.value.trim().length > 0 || attachments.value.length > 0
  );
  const showCameraMenu = computed(() => platformStore.info.isAndroidApp);
  const textareaRef = computed(
    () => textareaComponentRef.value?.textareaRef || null
  );

  /**
   * Returns DOM elements exposed from PromptActionToolbar.
   * Vue unwraps exposed refs on the parent component proxy, but some runtimes
   * still expose the raw ref object. Supporting both shapes prevents the
   * document outside-click handler from immediately closing desktop popovers
   * right after the trigger button is clicked.
   * @param {'modelRoot'|'toolRoot'|'attachRoot'} key Exposed toolbar root key.
   * @returns {HTMLElement|null}
   */
  function getToolbarRoot(key) {
    const root = toolbarRef.value?.[key];
    return root?.value || root || null;
  }

  function syncViewportMode() {
    // NOTE: `.app-container--mobile` 클래스 체크를 제거합니다.
    // 웹 PC 모드에서도 해당 클래스가 존재하는 경우 isMobileSheet=true가 되어
    // 모델/첨부 버튼 클릭 시 popover가 열리지 않고 BottomSheet도 열리지 않는 버그 발생.
    // viewport 너비 기준으로만 판단합니다.
    isMobileSheet.value = Boolean(
      window.matchMedia?.('(max-width: 900px)')?.matches
    );
  }

  function resize() {
    const el = textareaRef.value;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = window.matchMedia?.('(max-width: 900px)')?.matches
      ? 136
      : 160;
    const nextHeight = Math.min(Math.max(el.scrollHeight, 38), maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
    if (nextHeight !== lastHeight) {
      lastHeight = nextHeight;
      emit('height-change', nextHeight);
    }
  }

  function handleFocus() {
    emit('focus');
    nextTick(resize);
  }

  function submit() {
    const value = text.value.trim();
    if ((!value && attachments.value.length === 0) || props.disabled) return;
    emit('submit', {text: value, attachments: attachments.value});
    text.value = '';
    attachments.value = [];
    closeMenus();
    nextTick(resize);
  }

  function closeMenus(except = '') {
    if (except !== 'model') modelMenuOpen.value = false;
    if (except !== 'tool') toolMenuOpen.value = false;
    if (except !== 'attach') attachMenuOpen.value = false;
  }

  function openModelSelector() {
    if (props.disabled || props.modelReadonly) return;
    syncViewportMode();
    const next = !modelMenuOpen.value;
    closeMenus('model');
    modelMenuOpen.value = next;
  }

  function openToolSelector() {
    if (props.disabled) return;
    syncViewportMode();
    const next = !toolMenuOpen.value;
    closeMenus('tool');
    toolMenuOpen.value = next;
  }

  function openAttachSelector() {
    if (props.disabled) return;
    syncViewportMode();
    const next = !attachMenuOpen.value;
    closeMenus('attach');
    attachMenuOpen.value = next;
  }

  function selectModel(id) {
    emit('update:modelValue', id);
    modelMenuOpen.value = false;
  }

  function applyTool(tool) {
    text.value = text.value ? `${text.value}\n${tool.prompt}` : tool.prompt;
    toolMenuOpen.value = false;
    nextTick(() => {
      textareaRef.value?.focus();
      resize();
    });
  }

  async function openFilePicker(type) {
    if (props.disabled) return;
    attachMenuOpen.value = false;

    if (platformStore.info.isAndroidApp) {
      try {
        await openNativeFilePicker({
          source: type === 'camera' ? 'camera' : type === 'image' ? 'image' : 'all',
          multiple: type !== 'camera',
          accept: type === 'image' || type === 'camera' ? 'image/*' : '',
        });
        return;
      } catch (error) {
        logWarn('Android file picker failed. Falling back to web input.', error);
      }
    }

    const input = fileInputRef.value;
    if (!input) return;
    const isCamera = type === 'camera';
    const accept = type === 'image' || isCamera ? 'image/*' : '';
    const capture = isCamera ? 'environment' : null;
    fileAccept.value = accept;
    captureMode.value = capture;
    input.setAttribute('accept', accept);
    if (capture) input.setAttribute('capture', capture);
    else input.removeAttribute('capture');
    input.value = '';
    input.click();
  }

  function handleNativeFileSelected(event) {
    const detail = event?.detail || {};
    if (detail.type !== 'ON_FILE_SELECTED') return;
    const nativeFiles = detail.payload?.files || [];
    const mapped = nativeFiles.map(createNativeAttachment);
    if (mapped.length) attachments.value = [...attachments.value, ...mapped];
  }

  function handleFileChange(event) {
    addFiles(event.target.files);
    event.target.value = '';
  }

  function handlePaste(event) {
    const files = Array.from(event.clipboardData?.files || []);
    if (!files.length) return;
    addFiles(files);
  }

  function addFiles(fileList) {
    const mapped = Array.from(fileList || []).map(createBrowserAttachment);
    if (!mapped.length) return;

    attachments.value = [...attachments.value, ...mapped];
    mapped
      .filter((file) => file.kind === 'image')
      .forEach((attachment) => {
        hydrateImageAttachment(attachment, (dataUrl) => {
          const target = attachments.value.find(
            (file) => file.id === attachment.id
          );
          if (!target) return;
          target.dataUrl = dataUrl;
          target.previewUrl = dataUrl;
          target.previewError = false;
        });
      });

    nextTick(() => {
      resize();
      emit('height-change', lastHeight);
    });
  }

  function markPreviewError(file) {
    if (file) file.previewError = true;
  }

  function previewImage(file) {
    if (!file) return;
    const previewUrl = file.dataUrl || file.previewUrl || file.url || '';
    window.dispatchEvent(
      new CustomEvent('chat:image-preview', {
        detail: {...file, url: file.url || previewUrl, previewUrl},
      })
    );
  }

  function removeAttachment(id) {
    const target = attachments.value.find((file) => file.id === id);
    revokeAttachmentUrl(target);
    attachments.value = attachments.value.filter((file) => file.id !== id);
    nextTick(resize);
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
    window.addEventListener('android-to-js', handleNativeFileSelected);
    resize();
    window.addEventListener('resize', syncViewportMode, {passive: true});
    removeViewportListener = () =>
      window.removeEventListener('resize', syncViewportMode);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('android-to-js', handleNativeFileSelected);
    removeViewportListener?.();
    attachments.value.forEach((file) => {
      revokeAttachmentUrl(file);
    });
  });

  return {
    t,
    text,
    textareaComponentRef,
    toolbarRef,
    fileInputRef,
    attachments,
    attachMenuOpen,
    modelMenuOpen,
    toolMenuOpen,
    fileAccept,
    captureMode,
    isMobileSheet,
    currentModels,
    currentModel,
    tools,
    canSubmit,
    showCameraMenu,
    resize,
    handleFocus,
    submit,
    openModelSelector,
    openToolSelector,
    openAttachSelector,
    selectModel,
    applyTool,
    openFilePicker,
    handleFileChange,
    handlePaste,
    markPreviewError,
    previewImage,
    removeAttachment,
  };
}
