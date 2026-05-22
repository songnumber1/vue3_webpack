import {computed, nextTick, onMounted, toRef, watch} from "vue";
import {useI18n} from "vue-i18n";
import {usePromptMenu} from "@/composables/prompt/usePromptMenu";
import {usePromptText} from "@/composables/prompt/usePromptText";
import {usePromptAttachment} from "@/composables/prompt/usePromptAttachment";
import {usePromptSpeech} from "@/composables/prompt/usePromptSpeech";
import {usePromptModel} from "@/composables/prompt/usePromptModel";
import {usePromptTool} from "@/composables/prompt/usePromptTool";
import {usePromptTemplate} from "@/composables/prompt/usePromptTemplate";
import {useChatStore} from "@/stores/chatStore";

/**
 * @description 프롬프트 입력 영역의 모든 기능을 조합하는 slim 조합기입니다.
 * 세부 로직은 각 sub-composable에 위임하고, 이 함수는 조합과 제출 흐름만 담당합니다.
 * viewport 동기화는 usePromptMenu에서 orientationchange와 window.visualViewport 이벤트로 처리합니다.
 * @param {object} props - 컴포넌트 props
 * @param {Function} emit - 컴포넌트 emit 함수
 * @returns {object} 템플릿에 필요한 모든 상태와 핸들러
 */
export function usePromptComposer(props, emit) {
  const {t} = useI18n();
  const disabled = toRef(props, "disabled");
  const chatStore = useChatStore();

  // ── 공유 레이어: 뷰포트 감지 + 메뉴 상태 ──────────────────────────────
  const {
    toolbarRef,
    modelMenuOpen,
    toolMenuOpen,
    attachMenuOpen,
    isMobileSheet,
    syncViewportMode,
    closeMenus,
    toggleMenu,
  } = usePromptMenu();

  // ── 텍스트 입력 + 리사이즈 ────────────────────────────────────────────
  const {
    text,
    textareaComponentRef,
    hasPromptText,
    resize,
    handleFocus,
    handlePaste: getRawPastedFiles,
    getLastHeight,
    focusTextarea,
  } = usePromptText({isMobileSheet, emit});

  // ── 첨부 파일 ─────────────────────────────────────────────────────────
  const {
    fileInputRef,
    attachments,
    fileAccept,
    captureMode,
    attachOptions,
    openAttachSelector,
    openFilePicker,
    handleFileChange,
    addFiles,
    markPreviewError,
    previewImage,
    removeAttachment,
    clearAttachments,
  } = usePromptAttachment({
    attachMenuOpen,
    resize,
    getLastHeight,
    emit,
    disabled,
    toggleMenu,
  });

  // ── 음성 입력 ─────────────────────────────────────────────────────────
  const {
    isMicEnabled,
    isVoiceListening,
    hasVoiceStopped,
    isSpeechSupported,
    speech,
    startVoiceInput,
    stopVoiceInput,
  } = usePromptSpeech({text, resize, closeMenus, disabled, focusTextarea});

  // ── 모델 선택 ─────────────────────────────────────────────────────────
  const {currentModels, currentModel, openModelSelector, selectModel} =
    usePromptModel({props, modelMenuOpen, syncViewportMode, toggleMenu, emit});

  // ── 툴 선택 ───────────────────────────────────────────────────────────
  const {
    selectedTemplate,
    selectedTemplateGroups,
    hasSelectedTemplatePanel,
    activeMobileGroup,
    isTemplateOptionActive,
    selectTemplateOption,
    openTemplateOptionSheet,
    closeTemplateOptionSheet,
  } = usePromptTemplate({modelId: toRef(props, "modelValue")});

  const {tools, openToolSelector, applyTool} = usePromptTool({
    props,
    toolMenuOpen,
    syncViewportMode,
    toggleMenu,
    text,
    resize,
    focusTextarea,
  });

  watch(
    () => props.modelValue,
    (nextModelId, prevModelId) => {
      if (prevModelId && nextModelId !== prevModelId) {
        chatStore.resetActivePromptTemplate();
      }
    }
  );

  // ── 제출 (text + attachments 둘 다 필요하므로 조합기에 위치) ──────────
  const canSubmit = computed(
    () => hasPromptText.value || attachments.value.length > 0
  );

  function setText(value, {focus = true} = {}) {
    text.value = String(value || "");
    nextTick(() => {
      resize();
      if (focus) focusTextarea();
    });
  }

  function submit() {
    const value = text.value.trim();
    if ((!value && attachments.value.length === 0) || props.disabled) return;
    emit("submit", {
      text: value,
      attachments: attachments.value,
      promptTemplate: selectedTemplate.value,
    });
    text.value = "";
    clearAttachments();
    speech.resetToMic();
    closeMenus();
    nextTick(resize);
  }

  // ── paste 핸들러 래핑 (파일이 있으면 addFiles 호출) ──────────────────
  function handlePaste(event) {
    const files = getRawPastedFiles(event);
    if (files && files.length) addFiles(files);
  }

  // ── 마운트 시 초기 동기화 ─────────────────────────────────────────────
  onMounted(() => {
    syncViewportMode();
    resize();
  });

  return {
    t,
    // text
    text,
    textareaComponentRef,
    hasPromptText,
    resize,
    handleFocus,
    handlePaste,
    // attachment
    fileInputRef,
    attachments,
    fileAccept,
    captureMode,
    attachOptions,
    openAttachSelector,
    openFilePicker,
    handleFileChange,
    markPreviewError,
    previewImage,
    removeAttachment,
    // speech
    isMicEnabled,
    isVoiceListening,
    hasVoiceStopped,
    isSpeechSupported,
    startVoiceInput,
    stopVoiceInput,
    // model
    currentModels,
    currentModel,
    openModelSelector,
    selectModel,
    // template
    selectedTemplate,
    selectedTemplateGroups,
    hasSelectedTemplatePanel,
    activeMobileGroup,
    isTemplateOptionActive,
    selectTemplateOption,
    openTemplateOptionSheet,
    closeTemplateOptionSheet,
    // tool
    tools,
    openToolSelector,
    applyTool,
    // menu / viewport
    toolbarRef,
    modelMenuOpen,
    toolMenuOpen,
    attachMenuOpen,
    isMobileSheet,
    // submit
    canSubmit,
    submit,
    setText,
  };
}
