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
import {useSpeechRecognition} from '@/composables/useSpeechRecognition';
import {logWarn} from '@/utils/logger';
import {
  ANDROID_TO_JS_EVENT,
  ATTACH_MENU_OPTIONS,
  DEFAULT_FALLBACK_MODEL,
  FILE_PICKER_TYPE,
  IMAGE_PREVIEW_EVENT,
  NATIVE_FILE_SELECTED_TYPE,
  PROMPT_TEXTAREA_HEIGHT,
  PROMPT_TOOL_DEFINITIONS,
  PROMPT_VIEWPORT_QUERY,
} from '@/constants/promptComposer';

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
  const isMicEnabled = computed(() => Boolean(platformStore.info.isMic));
  let lastHeight = 0;
  let removeViewportListener = null;

  const fallbackModels = computed(() => [
    {id: props.modelValue, ...DEFAULT_FALLBACK_MODEL},
  ]);
  const currentModels = computed(() =>
    props.models.length ? props.models : fallbackModels.value
  );
  const currentModel = computed(
    () =>
      currentModels.value.find((model) => model.id === props.modelValue) ||
      currentModels.value[0]
  );
  const tools = computed(() =>
    PROMPT_TOOL_DEFINITIONS.map((tool) => ({
      ...tool,
      label: t(tool.labelKey),
    }))
  );
  const showCameraMenu = computed(() => platformStore.info.isAndroidApp);
  const attachOptions = computed(() =>
    ATTACH_MENU_OPTIONS.filter(
      (option) => !option.requiresCamera || showCameraMenu.value
    ).map((option) => ({
      ...option,
      label: t(option.labelKey),
    }))
  );
  const hasPromptText = computed(() => text.value.trim().length > 0);
  const canSubmit = computed(
    () => hasPromptText.value || attachments.value.length > 0
  );
  const speech = useSpeechRecognition({
    language: 'ko-KR',
    onText: (nextText) => {
      text.value = nextText;
      nextTick(resize);
    },
  });
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
      window.matchMedia?.(PROMPT_VIEWPORT_QUERY)?.matches
    );
  }

  function resize() {
    const el = textareaRef.value;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = window.matchMedia?.(PROMPT_VIEWPORT_QUERY)?.matches
      ? PROMPT_TEXTAREA_HEIGHT.mobileMax
      : PROMPT_TEXTAREA_HEIGHT.desktopMax;
    const nextHeight = Math.min(
      Math.max(el.scrollHeight, PROMPT_TEXTAREA_HEIGHT.min),
      maxHeight
    );
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
    speech.resetToMic();
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

  function startVoiceInput() {
    if (props.disabled || !isMicEnabled.value) return;
    closeMenus();
    speech.start(text.value);
  }

  function stopVoiceInput() {
    speech.stopByUser();
    nextTick(() => {
      textareaRef.value?.focus();
      resize();
    });
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

  async function openFilePicker(type = FILE_PICKER_TYPE.all) {
    if (props.disabled) return;
    attachMenuOpen.value = false;

    const option =
      ATTACH_MENU_OPTIONS.find((item) => item.id === type) ||
      ATTACH_MENU_OPTIONS.find((item) => item.id === FILE_PICKER_TYPE.all);

    if (platformStore.info.isAndroidApp) {
      try {
        await openNativeFilePicker({
          source: option.nativeSource,
          multiple: option.multiple,
          accept: option.accept,
        });
        return;
      } catch (error) {
        logWarn('Android file picker failed. Falling back to web input.', error);
      }
    }

    const input = fileInputRef.value;
    if (!input) return;

    fileAccept.value = option.accept;
    captureMode.value = option.capture;
    input.setAttribute('accept', option.accept);
    if (option.capture) input.setAttribute('capture', option.capture);
    else input.removeAttribute('capture');
    input.value = '';
    input.click();
  }

  function handleNativeFileSelected(event) {
    const detail = event?.detail || {};
    if (detail.type !== NATIVE_FILE_SELECTED_TYPE) return;
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
      new CustomEvent(IMAGE_PREVIEW_EVENT, {
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
    window.addEventListener(ANDROID_TO_JS_EVENT, handleNativeFileSelected);
    resize();
    window.addEventListener('resize', syncViewportMode, {passive: true});
    removeViewportListener = () =>
      window.removeEventListener('resize', syncViewportMode);
  });

  onBeforeUnmount(() => {
    window.removeEventListener(ANDROID_TO_JS_EVENT, handleNativeFileSelected);
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
    isMicEnabled,
    isVoiceListening: speech.isListening,
    hasVoiceStopped: speech.hasManualStop,
    isSpeechSupported: speech.isSupported,
    currentModels,
    currentModel,
    tools,
    attachOptions,
    hasPromptText,
    canSubmit,
    resize,
    handleFocus,
    submit,
    openModelSelector,
    openToolSelector,
    openAttachSelector,
    startVoiceInput,
    stopVoiceInput,
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
