import {computed, nextTick, onBeforeUnmount, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {usePlatformStore} from '@/stores/platformStore';
import {openNativeFilePicker} from '@/services/platformBridge';
import {
// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
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
 * @description usePromptComposer 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} props - props 입력값입니다.
 * @param {*} emit - emit 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
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
   * @description getToolbarRoot 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} key - key 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function getToolbarRoot(key) {
    const root = toolbarRef.value?.[key];
    // 계산된 결과를 호출부로 반환합니다.
    return root?.value || root || null;
  }

  /**
   * @description syncViewportMode 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function syncViewportMode() {
    isMobileSheet.value = Boolean(
      window.matchMedia?.(PROMPT_VIEWPORT_QUERY)?.matches
    );
  }

  /**
   * @description resize 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function resize() {
    const el = textareaRef.value;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (nextHeight !== lastHeight) {
      lastHeight = nextHeight;
      emit('height-change', nextHeight);
    }
  }

  /**
   * @description handleFocus 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function handleFocus() {
    emit('focus');
    nextTick(resize);
  }

  /**
   * @description submit 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function submit() {
    const value = text.value.trim();
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if ((!value && attachments.value.length === 0) || props.disabled) return;
    emit('submit', {text: value, attachments: attachments.value});
    text.value = '';
    attachments.value = [];
    speech.resetToMic();
    closeMenus();
    nextTick(resize);
  }

  /**
   * @description closeMenus 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} except - except 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function closeMenus(except = '') {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (except !== 'model') modelMenuOpen.value = false;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (except !== 'tool') toolMenuOpen.value = false;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (except !== 'attach') attachMenuOpen.value = false;
  }

  /**
   * @description openModelSelector 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function openModelSelector() {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (props.disabled || props.modelReadonly) return;
    syncViewportMode();
    const next = !modelMenuOpen.value;
    closeMenus('model');
    modelMenuOpen.value = next;
  }

  /**
   * @description openToolSelector 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function openToolSelector() {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (props.disabled) return;
    syncViewportMode();
    const next = !toolMenuOpen.value;
    closeMenus('tool');
    toolMenuOpen.value = next;
  }

  /**
   * @description openAttachSelector 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function openAttachSelector() {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (props.disabled) return;
    syncViewportMode();
    const next = !attachMenuOpen.value;
    closeMenus('attach');
    attachMenuOpen.value = next;
  }

  /**
   * @description startVoiceInput 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function startVoiceInput() {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (props.disabled || !isMicEnabled.value) return;
    closeMenus();
    speech.start(text.value);
  }

  /**
   * @description stopVoiceInput 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function stopVoiceInput() {
    speech.stopByUser();
    nextTick(() => {
      textareaRef.value?.focus();
      resize();
    });
  }

  /**
   * @description selectModel 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} id - id 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function selectModel(id) {
    emit('update:modelValue', id);
    modelMenuOpen.value = false;
  }

  /**
   * @description applyTool 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} tool - tool 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function applyTool(tool) {
    text.value = text.value ? `${text.value}\n${tool.prompt}` : tool.prompt;
    toolMenuOpen.value = false;
    nextTick(() => {
      textareaRef.value?.focus();
      resize();
    });
  }

  /**
   * @description openFilePicker 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} type - type 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  async function openFilePicker(type = FILE_PICKER_TYPE.all) {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (props.disabled) return;
    attachMenuOpen.value = false;

    const option =
      ATTACH_MENU_OPTIONS.find((item) => item.id === type) ||
      ATTACH_MENU_OPTIONS.find((item) => item.id === FILE_PICKER_TYPE.all);

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (platformStore.info.isAndroidApp) {
      // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
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
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!input) return;

    fileAccept.value = option.accept;
    captureMode.value = option.capture;
    input.setAttribute('accept', option.accept);
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (option.capture) input.setAttribute('capture', option.capture);
    else input.removeAttribute('capture');
    input.value = '';
    input.click();
  }

  /**
   * @description handleNativeFileSelected 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} event - event 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function handleNativeFileSelected(event) {
    const detail = event?.detail || {};
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (detail.type !== NATIVE_FILE_SELECTED_TYPE) return;
    const nativeFiles = detail.payload?.files || [];
    const mapped = nativeFiles.map(createNativeAttachment);
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (mapped.length) attachments.value = [...attachments.value, ...mapped];
  }

  /**
   * @description handleFileChange 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} event - event 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function handleFileChange(event) {
    addFiles(event.target.files);
    event.target.value = '';
  }

  /**
   * @description handlePaste 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} event - event 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function handlePaste(event) {
    const files = Array.from(event.clipboardData?.files || []);
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!files.length) return;
    addFiles(files);
  }

  /**
   * @description addFiles 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} fileList - fileList 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function addFiles(fileList) {
    const mapped = Array.from(fileList || []).map(createBrowserAttachment);
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!mapped.length) return;

    attachments.value = [...attachments.value, ...mapped];
    mapped
      .filter((file) => file.kind === 'image')
      .forEach((attachment) => {
        hydrateImageAttachment(attachment, (dataUrl) => {
          const target = attachments.value.find(
            (file) => file.id === attachment.id
          );
          // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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

  /**
   * @description markPreviewError 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} file - file 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function markPreviewError(file) {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (file) file.previewError = true;
  }

  /**
   * @description previewImage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} file - file 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function previewImage(file) {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!file) return;
    const previewUrl = file.dataUrl || file.previewUrl || file.url || '';
    window.dispatchEvent(
      new CustomEvent(IMAGE_PREVIEW_EVENT, {
        detail: {...file, url: file.url || previewUrl, previewUrl},
      })
    );
  }

  /**
   * @description removeAttachment 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} id - id 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
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

  // Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
  onMounted(() => {
    syncViewportMode();
    window.addEventListener(ANDROID_TO_JS_EVENT, handleNativeFileSelected);
    resize();
    window.addEventListener('resize', syncViewportMode, {passive: true});
    removeViewportListener = () =>
      window.removeEventListener('resize', syncViewportMode);
  });

  // Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
  onBeforeUnmount(() => {
    window.removeEventListener(ANDROID_TO_JS_EVENT, handleNativeFileSelected);
    removeViewportListener?.();
    attachments.value.forEach((file) => {
      revokeAttachmentUrl(file);
    });
  });

  // 계산된 결과를 호출부로 반환합니다.
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
