<template>
  <footer
    class="prompt-wrap tw-w-full"
    :class="{
      'prompt-wrap--floating': floating,
      'prompt-wrap--expanded': isPromptExpanded,
    }"
  >
    <form
      ref="fileDropZoneRef"
      class="prompt-box prompt-box--gemini tw-relative tw-flex tw-w-full tw-flex-col tw-border tw-border-app-promptBorder tw-bg-app-prompt tw-shadow-prompt"
      :class="{
        'prompt-box--expanded': isPromptExpanded,
        'prompt-box--desktop-top-actions': usesDesktopTopActions,
        'prompt-box--file-dragging': isFileDragging,
        'prompt-box--file-drop-disabled': isFileDropDisabled,
      }"
      @submit.prevent="submit"
    >
      <PromptInputDesktop
        v-if="usesDesktopTopActions"
        :ref="setPromptInputRef"
        :attachments="attachments"
        :has-selected-template-panel="hasSelectedTemplatePanel"
        :selected-template-groups="selectedTemplateGroups"
        :is-prompt-expanded="isPromptExpanded"
        :prompt-expand-toggle-label="promptExpandToggleLabel"
        @preview="previewImage"
        @remove-attachment="removeAttachment"
        @preview-error="markPreviewError"
        @select-option="selectTemplateOption"
        @open-model="openModelSelector"
        @open-tool="openToolSelector"
        @close-tool="toolMenuOpen = false"
        @open-attach="openAttachSelector"
        @select-model="selectModel"
        @open-file-picker="openFilePicker"
        @focus="handleFocus"
        @blur="emit('blur')"
        @input="resize"
        @submit="submit"
        @paste="handlePaste"
        @start-voice="startVoiceInput"
        @stop-voice="stopVoiceInput"
        @toggle-expanded="togglePromptExpanded"
      />

      <PromptInputMobile
        v-else
        :ref="setPromptInputRef"
        :attachments="attachments"
        :has-selected-template-panel="hasSelectedTemplatePanel"
        :selected-template-groups="selectedTemplateGroups"
        :active-mobile-group="activeMobileGroup"
        :is-prompt-expanded="isPromptExpanded"
        :prompt-expand-toggle-label="promptExpandToggleLabel"
        @preview="previewImage"
        @remove-attachment="removeAttachment"
        @preview-error="markPreviewError"
        @select-option="selectTemplateOption"
        @open-mobile-group="openTemplateOptionSheet"
        @close-mobile-group="closeTemplateOptionSheet"
        @open-model="openModelSelector"
        @open-tool="openToolSelector"
        @open-attach="openAttachSelector"
        @select-model="selectModel"
        @open-file-picker="openFilePicker"
        @focus="handleFocus"
        @blur="emit('blur')"
        @input="resize"
        @submit="submit"
        @paste="handlePaste"
        @start-voice="startVoiceInput"
        @stop-voice="stopVoiceInput"
        @toggle-expanded="togglePromptExpanded"
      />

      <input
        ref="fileInputRef"
        class="visually-hidden-file-input tw-sr-only"
        type="file"
        multiple
        :accept="fileAccept"
        :capture="captureMode"
        @change="handleFileChange"
      />
    </form>
    <p
      v-if="showHelp"
      class="prompt-help tw-mt-2 tw-text-center tw-text-xs tw-text-app-subtle"
    >
      UI demo. Extend resolver/api.js for production integration.
    </p>

    <PromptModelBottomSheet
      :open="modelMenuOpen && isMobileSheet && !modelReadonly"
      :title="t('chat.modelSelect')"
      :model-value="modelValue"
      :models="currentModels"
      @close="modelMenuOpen = false"
      @select-model="selectModel"
    />

    <PromptToolBottomSheet
      :open="toolMenuOpen && isMobileSheet"
      :title="t('chat.tools')"
      :model-value="modelValue"
      @close="toolMenuOpen = false"
    />

    <PromptAttachBottomSheet
      :open="attachMenuOpen && isMobileSheet"
      :title="t('chat.attach')"
      :attach-options="attachOptions"
      @close="attachMenuOpen = false"
      @open-file-picker="openFilePicker"
    />
  </footer>
</template>

<script setup>
/**
 * @file components/prompt/PromptComposer.vue
 * @description 프롬프트 입력 UI 컴포넌트입니다. Prompt 상태는 PROMPT_STATE_KEY로 주입받고, 내부 툴바 상태는 PROMPT_TOOLBAR_STATE_KEY로 제공합니다.
 */

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  reactive,
  ref,
  toRef,
  watch,
  inject,
} from "vue";
import PromptInputDesktop from "@/components/prompt/input/PromptInputDesktop.vue";
import PromptInputMobile from "@/components/prompt/input/PromptInputMobile.vue";
import PromptAttachBottomSheet from "@/components/prompt/attach/mobile/PromptAttachBottomSheet.vue";
import PromptModelBottomSheet from "@/components/prompt/model/mobile/PromptModelBottomSheet.vue";
import PromptToolBottomSheet from "@/components/prompt/tools/mobile/PromptToolBottomSheet.vue";
import {useI18n} from "vue-i18n";
import {useEventListener} from "@vueuse/core";
import {usePromptMenu} from "@/composables/prompt/usePromptMenu";
import {usePromptText} from "@/composables/prompt/usePromptText";
import {
  ANDROID_TO_JS_EVENT,
  ATTACH_MENU_OPTIONS,
  DEFAULT_FALLBACK_MODEL,
  FILE_PICKER_TYPE,
  IMAGE_PREVIEW_EVENT,
  NATIVE_FILE_SELECTED_TYPE,
  PROMPT_MENU_TYPE,
  PROMPT_SPEECH_LANGUAGE,
  PROMPT_TEMPLATE_MODEL_IDS,
} from "@/constants/promptComposer";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {useAssistantStore} from "@/stores/assistantStore";
import {usePlatformStore} from "@/stores/platformStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useSpeechRecognition} from "@/platform/speech/useSpeechRecognition";
import {useFileDragDrop} from "@/composables/file/useFileDragDrop";
import {openNativeFilePicker} from "@/platform/bridge/platformBridge";
import {
  createBrowserAttachment,
  createNativeAttachment,
  imageAttachment,
  revokeAttachmentUrl,
} from "@/utils/attachment";
import {logWarn} from "@/utils/logger";
import {resolvePromptTemplateToolIcon} from "@/constants/toolIcons";
import {
  PROMPT_TEXTAREA_STATE_KEY,
  PROMPT_TOOLBAR_STATE_KEY,
  PROMPT_STATE_KEY,
  createEmptyPromptState,
} from "@/composables/chat/chatStateContext";

const componentProps = defineProps({
  submitDisabled: {type: Boolean, default: false},
  hideToolActions: {type: Boolean, default: false},
  hideAttachActions: {type: Boolean, default: false},
  hideVoiceAction: {type: Boolean, default: false},
});

const promptState = inject(PROMPT_STATE_KEY, computed(createEmptyPromptState));
const props = reactive({
  get disabled() {
    return promptState.value.disabled;
  },
  get generating() {
    return promptState.value.generating;
  },
  get submitDisabled() {
    return componentProps.submitDisabled;
  },
  get hideToolActions() {
    return componentProps.hideToolActions;
  },
  get hideAttachActions() {
    return componentProps.hideAttachActions;
  },
  get hideVoiceAction() {
    return componentProps.hideVoiceAction;
  },
  get floating() {
    return promptState.value.floating;
  },
  get showHelp() {
    return promptState.value.showHelp;
  },
  get placeholder() {
    return promptState.value.placeholder;
  },
  get modelValue() {
    return promptState.value.selectedModel;
  },
  get models() {
    return promptState.value.models;
  },
  get modelReadonly() {
    return promptState.value.modelReadonly;
  },
});

const emit = defineEmits([
  "blur",
  "expanded-change",
  "submit",
  "update:modelValue",
  "focus",
  "height-change",
]);

function handleComposerEvent(eventName, payload) {
  if (eventName === "submit") {
    if (componentProps.submitDisabled) return;
    emit("submit", payload);
    return;
  }
  if (eventName === "open-tool") {
    if (componentProps.hideToolActions) return;
  }
  if (eventName === "open-attach" || eventName === "open-file-picker") {
    if (componentProps.hideAttachActions) return;
  }
  if (eventName === "start-voice" || eventName === "stop-voice") {
    if (componentProps.hideVoiceAction) return;
  }
  if (eventName === "update:modelValue") {
    emit("update:modelValue", payload);
    return;
  }
  if (eventName === "focus") {
    emit("focus", payload);
    return;
  }
  if (eventName === "height-change") {
    emit("height-change", payload);
    return;
  }
  if (eventName === "blur") {
    emit("blur", payload);
  }
}

// 1. 다국어 메시지 처리를 위한 i18n 인스턴스로부터 t 번역 메서드를 확보합니다.
const {t, locale} = useI18n();
// 2. 외부 Props의 변경 사항을 하위 서브 훅들이 안전하게 반응형 추적할 수 있도록 `toRef` 단방향 참조 처리를 수행합니다.
const disabled = toRef(props, "disabled");
const attachmentDisabled = computed(() =>
  Boolean(disabled.value || props.submitDisabled || props.hideAttachActions)
);

// 3. 모델 변경 시 활성화된 템플릿 설정을 초기화하기 위해 프롬프트 제어 Pinia 스토어를 로드합니다.
const promptControlStore = usePromptControlStore();
const platformStore = usePlatformStore();
const systemSettingsStore = useSystemSettingsStore();

// ── [공유 레이어: 뷰포트 감지 + 메뉴 상태] ──────────────────────────────
// 하드웨어 오리엔테이션 전환이나 가상 키보드가 올라올 때 드롭다운 메뉴들의 UI 정합성을 보정하는 영역입니다.
const {
  toolbarRef, // 하단 프롬프트 툴바 컨테이너 DOM 노드 접근용 Vue Ref
  modelMenuOpen, // AI 모델 변경 드롭다운 모달 개폐 상태 (Boolean)
  toolMenuOpen, // 부가 플러그인 툴 목록 모달 개폐 상태 (Boolean)
  attachMenuOpen, // 파일 업로드 첨부 방식 선택 모달 개폐 상태 (Boolean)
  isMobileSheet, // 현재 레이아웃이 모바일 하단 바텀시트로 그려져야 하는지 여부
  syncViewportMode, // 디바이스 스크린 규격을 분석하여 모바일/PC 상태 플래그를 정문화하는 메서드
  closeMenus, // 현재 열려 있는 모든 하위 도구 레이어 팝업을 일괄 폐쇄하는 메서드
  toggleMenu, // 특정 타깃 도구 팝업 메뉴를 토글식으로 열고 닫는 제어 메서드
} = usePromptMenu();

// ── [텍스트 입력 + 리사이즈] ────────────────────────────────────────────
// 사용자가 한 줄 혹은 여러 줄의 텍스트를 기재할 때 textarea 요소의 렌더링 물리 상태를 핸들링합니다.
const isPromptExpanded = computed({
  get: () => promptControlStore.activePromptExpanded,
  set: (value) => {
    promptControlStore.setActivePromptExpanded(value);
  },
});

const {
  text, // 사용자가 작성 중인 순수 텍스트 문자열 반응형 참조 객체 (Ref)
  textareaComponentRef, // 가변 textarea DOM 컴포넌트 인스턴스 참조용 Ref
  hasPromptText, // 공백을 제외하고 현재 입력창에 실질적인 글자가 채워져 있는지 여부 (Computed)
  resize, // 텍스트 길이에 맞춰 입력창 높이를 실시간으로 늘리거나 줄이는 가변 높이 계산 함수
  handleFocus, // 입력창 포커스 이벤트 발생 시 키보드 레이아웃 보정을 실행하는 이벤트 핸들러
  handlePaste: getRawPastedFiles, // 붙여넣기 이벤트 시 텍스트 속에 섞인 원본 파일 오브젝트만 필터 추출하는 핸들러
  getLastHeight, // 이전 시점에 기록되었던 텍스트 창의 최종 높이 픽셀값을 반환하는 유틸 함수
  focusTextarea, // 텍스트 입력창으로 포커스 커서를 강제 이동(주입)시키는 제어 함수
  restoreTextareaAutoGrow, // 최대화 해제 후 textarea inline style을 기존 auto-grow 상태로 복원하는 함수
  clearText, // 전송 직후 반응형 값과 실제 textarea DOM 값을 함께 비우는 함수
} = usePromptText({
  emit: handleComposerEvent,
  isExpanded: isPromptExpanded,
});

function setPromptInputRef(instance) {
  toolbarRef.value = instance || null;
  textareaComponentRef.value = instance || null;
}

// ── [첨부 파일] ─────────────────────────────────────────────────────────
// 이미지, 문서 등의 물리 미디어 파일을 드롭다운 메뉴나 운영체제 탐색기를 통해 수집합니다.
const fileInputRef = ref(null);
const fileDropZoneRef = ref(null);
const attachments = ref([]);
const fileAccept = ref("");
const captureMode = ref(null);

const showCameraMenu = computed(() => platformStore.info.isAndroidApp);
const attachOptions = computed(() =>
  ATTACH_MENU_OPTIONS.filter(
    (option) => !option.requiresCamera || showCameraMenu.value
  ).map((option) => ({
    ...option,
    label: t(option.labelKey),
  }))
);

function openAttachSelector() {
  if (attachmentDisabled.value) return;
  toggleMenu(PROMPT_MENU_TYPE.attach);
}

async function openFilePicker(type = FILE_PICKER_TYPE.all) {
  if (attachmentDisabled.value) return;
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
      logWarn("Android file picker failed. Falling back to web input.", error);
    }
  }

  const input = fileInputRef.value;
  if (!input) return;

  fileAccept.value = option.accept;
  captureMode.value = option.capture;

  input.setAttribute("accept", option.accept);
  if (option.capture) input.setAttribute("capture", option.capture);
  else input.removeAttribute("capture");

  input.value = "";
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
  event.target.value = "";
}

function addFiles(fileList) {
  const mapped = Array.from(fileList || []).map(createBrowserAttachment);
  if (!mapped.length) return;

  attachments.value = [...attachments.value, ...mapped];

  mapped
    .filter((file) => file.kind === "image")
    .forEach((attachment) => {
      imageAttachment(attachment, (dataUrl) => {
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
    handleComposerEvent("height-change", getLastHeight());
  });
}

function markPreviewError(file) {
  if (file) file.previewError = true;
}

function previewImage(file) {
  if (!file) return;
  const previewUrl = file.dataUrl || file.previewUrl || file.url || "";
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

function clearAttachments() {
  attachments.value.forEach((file) => {
    revokeAttachmentUrl(file);
  });
  attachments.value = [];
}

function handleDroppedFiles(files) {
  if (attachmentDisabled.value) return;
  addFiles(files);
}

const {isFileDragging, isFileDropDisabled} = useFileDragDrop({
  targetRef: fileDropZoneRef,
  enabled: computed(() => !attachmentDisabled.value),
  onDropFiles: handleDroppedFiles,
});

useEventListener(window, ANDROID_TO_JS_EVENT, handleNativeFileSelected);

// ── [음성 입력] ─────────────────────────────────────────────────────────
// STT (Speech-to-Text) 기능을 연동하여 음성을 텍스트 프롬프트 문자열로 치환하는 영역입니다.
const isMicEnabled = computed(
  () => systemSettingsStore.useMicrophone && Boolean(platformStore.info.isMic)
);

const speech = useSpeechRecognition({
  language: PROMPT_SPEECH_LANGUAGE,
  onText: (nextText) => {
    text.value = nextText;
    nextTick(resize);
  },
});

const isVoiceListening = speech.isListening;
const hasVoiceStopped = speech.hasManualStop;
const isSpeechSupported = speech.isSupported;

function startVoiceInput() {
  if (disabled.value || !isMicEnabled.value || !speech.isSupported.value) {
    return;
  }

  closeMenus();
  speech.start(text.value);
}

function stopVoiceInput() {
  speech.stopByUser();
  nextTick(() => {
    focusTextarea();
    resize();
  });
}

// ── [모델 선택] ─────────────────────────────────────────────────────────
// 현재 어시스턴트에서 스위칭 가능한 LLM 백엔드 모델 라인업을 동기화하고 변경을 허용합니다.
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

function openModelSelector() {
  if (props.disabled || props.modelReadonly) return;
  syncViewportMode();
  toggleMenu(PROMPT_MENU_TYPE.model);
}

function selectModel(id) {
  if (props.disabled || props.modelReadonly) {
    modelMenuOpen.value = false;
    return;
  }

  if (id !== props.modelValue) {
    promptControlStore.resetActivePromptTemplate();
  }

  handleComposerEvent("update:modelValue", id);
  modelMenuOpen.value = false;
}

// ── [툴 / 프롬프트 템플릿 선택] ───────────────────────────────────────────
// 특정 페르소나나 업무 서식이 가미된 프롬프트 문틀(Template) 및 확장 API 기능(Tool)을 조합합니다.
const assistantStore = useAssistantStore();
const activeMobileGroupId = ref("");
const activePromptToolSettings = computed(
  () => promptControlStore.activePromptToolSettings
);

function resolveLocaleValue(value = {}, localeCode = "ko") {
  if (!value || typeof value !== "object") return "";
  return value[localeCode] || value.ko || value.en || "";
}

function isSelectableTemplate(template = {}) {
  if (!template?.id || template.default) return false;
  if (!PROMPT_TEMPLATE_MODEL_IDS.includes(template.modelId)) return false;
  return ["mail", "translate", "summary", "code"].includes(template.key);
}

function hasTemplateFields(template = {}) {
  return Object.keys(template || {}).length > 0;
}

const currentModelTemplates = computed(() => {
  const selectedModelId =
    props.modelValue || assistantStore.selectedModelId || "";

  return assistantStore.promptTemplates
    .filter((template) => isSelectableTemplate(template))
    .filter(
      (template) => !template.modelId || template.modelId === selectedModelId
    )
    .sort((a, b) => a.order - b.order);
});

const selectedTemplate = computed(() => {
  const selectedId = activePromptToolSettings.value.promptTemplateId;
  if (!selectedId) return null;

  return (
    currentModelTemplates.value.find(
      (template) => template.id === selectedId
    ) || null
  );
});

const selectedTemplateOptions = computed(
  () => activePromptToolSettings.value.promptTemplateOptions || {}
);

const selectedTemplateGroups = computed(() => {
  const template = selectedTemplate.value?.template || {};

  return Object.entries(template)
    .map(([groupId, group]) => {
      const baseOptions = Array.isArray(group.content)
        ? group.content.map((option) => ({
            tag: option.tag || option.ko || option.en || "",
            label: resolveLocaleValue(option, locale.value),
          }))
        : [];

      const selectedTag =
        selectedTemplateOptions.value[groupId] || baseOptions[0]?.tag || "";
      const options = baseOptions.map((option) => ({
        ...option,
        active: option.tag === selectedTag,
      }));
      const selectedOption =
        options.find((option) => option.active) || options[0] || null;

      return {
        id: groupId,
        label: resolveLocaleValue(group, locale.value),
        type: group.type || "radio",
        options,
        selectedTag,
        selectedLabel: selectedOption?.label || "",
      };
    })
    .filter((group) => group.label && group.options.length > 0);
});

const activeMobileGroup = computed(() => {
  return (
    selectedTemplateGroups.value.find(
      (group) => group.id === activeMobileGroupId.value
    ) || null
  );
});

const hasSelectedTemplatePanel = computed(() => {
  return Boolean(
    selectedTemplate.value &&
    hasTemplateFields(selectedTemplate.value.template) &&
    selectedTemplateGroups.value.length > 0
  );
});

function selectTemplateOption(groupId, optionTag) {
  promptControlStore.setPromptTemplateOption(groupId, optionTag);
  activeMobileGroupId.value = "";
}

function openTemplateOptionSheet(groupId) {
  activeMobileGroupId.value = groupId;
}

function closeTemplateOptionSheet() {
  activeMobileGroupId.value = "";
}

function openToolSelector() {
  if (props.disabled || props.submitDisabled || props.hideToolActions) return;
  syncViewportMode();
  toggleMenu(PROMPT_MENU_TYPE.tool);
}

const selectedTemplateTool = computed(() => {
  const template = selectedTemplate.value;
  if (!template) return null;

  const label =
    locale.value === "en"
      ? template.nameEn || template.nameKo || template.templateName || ""
      : template.nameKo || template.nameEn || template.templateName || "";

  return {
    ...template,
    label,
    iconSrc: resolvePromptTemplateToolIcon(template.key),
  };
});

// 4. [반응형 감시자 (Watch)] 유저가 상단이나 설정에서 AI 거대모델(modelValue)을 다른 종류로 전격 스위칭한 경우,
watch(
  () => props.modelValue,
  (nextModelId, prevModelId) => {
    // 기존 모델 정보가 확실히 실재했고, 바뀐 신규 모델 ID가 이전과 엄연히 다르다면, 기존에 적용되어 돌고 있던 프롬프트 템플릿과의 정합성이 깨지므로 서식을 즉시 초기화해 줍니다.
    if (prevModelId && nextModelId !== prevModelId) {
      promptControlStore.resetActivePromptTemplate();
    }
  }
);

watch(
  () => props.modelReadonly,
  (readonly) => {
    if (readonly) modelMenuOpen.value = false;
  },
  {flush: "post"}
);

// ── [제출 제어 레이어] ──────────────────────────────────────────────────
// 전체 입력창의 잠금 플래그 상태 및 제출 가능 가동 조건을 한곳으로 집중하여 통합 산출합니다.

/** 답변 스트리밍 중에도 입력창과 주변 액션 UI는 잠그지 않고, 전송 버튼만 generating 상태로 progress를 표시합니다. */
const actionDisabled = computed(() => disabled.value);

/** 텍스트 입력이나 첨부가 있으면 제출 조건은 충족합니다. 실제 중복 전송은 submit()과 useChatSubmit에서 generating으로 방어합니다. */
const canSubmit = computed(
  () =>
    !props.submitDisabled &&
    (hasPromptText.value || attachments.value.length > 0)
);

/**
 * 외부 추천 질문 칩(Chips) 선택이나 가이드 프롬프트 클릭 시, 텍스트창 내용을 강제 삽입하고 크기를 리사이징 보정하는 외부 연동 유틸 메서드입니다.
 * @param {string} value - 입력창에 강제 주입할 텍스트 본문
 * @param {Object} [options={focus:true}] - 입력 즉시 커서 포커싱을 강제 적용할지 여부 제어 옵션
 */
function setText(value, {focus = true} = {}) {
  text.value = String(value || "");

  nextTick(() => {
    restoreTextareaAutoGrow();

    if (focus) {
      nextTick(focusTextarea);
    }
  });
}

function getTextareaElement() {
  const exposed = textareaComponentRef.value;
  return (
    exposed?.textareaRef?.value || exposed?.textareaRef || exposed?.$el || null
  );
}

function isTextEditingElement(element) {
  if (!element) return false;
  const tagName = element.tagName?.toLowerCase?.();
  return (
    tagName === "textarea" ||
    tagName === "input" ||
    element.isContentEditable === true
  );
}

function readRootPxVar(name) {
  if (typeof window === "undefined" || typeof document === "undefined")
    return 0;
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name);
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isSoftKeyboardLikelyOpen() {
  if (typeof window === "undefined" || typeof document === "undefined")
    return false;

  const visualViewport = window.visualViewport;
  const visualHeight = visualViewport?.height || 0;
  const layoutHeight = Math.max(
    window.innerHeight || 0,
    document.documentElement?.clientHeight || 0,
    readRootPxVar("--layout-viewport-height"),
    readRootPxVar("--app-height")
  );
  const cssKeyboardHeight = Math.max(
    readRootPxVar("--keyboard-height"),
    readRootPxVar("--mobile-keyboard-inset"),
    readRootPxVar("--composer-keyboard-inset")
  );

  return (
    cssKeyboardHeight > 48 ||
    (visualHeight > 0 && layoutHeight - visualHeight > 80)
  );
}

function blurTextareaForMobileSubmit() {
  if (!isMobileSheet.value) return false;

  const textarea = getTextareaElement();
  const activeElement =
    typeof document !== "undefined" ? document.activeElement : null;
  const wasFocused = activeElement === textarea;
  const keyboardWasOpen = isSoftKeyboardLikelyOpen();

  // 실제 모바일 Chrome에서는 전송 버튼 탭 시 activeElement가 버튼으로 바뀌어도
  // visualViewport는 아직 키보드 열린 상태일 수 있으므로 textarea와 현재 편집 요소를 모두 blur합니다.
  if (textarea && typeof textarea.blur === "function") textarea.blur();
  if (
    activeElement !== textarea &&
    isTextEditingElement(activeElement) &&
    typeof activeElement.blur === "function"
  ) {
    activeElement.blur();
  }

  return Boolean(wasFocused || keyboardWasOpen);
}

/**
 * [핵심 최종 트리거] 사용자가 전송 버튼을 누르거나 엔터 단축키를 입력했을 때 유저 프롬프트 패키지를 패킹하여 부모 화면으로 최종 Submit 전송합니다.
 */
function submit() {
  const value = text.value.trim();

  // 텍스트 공백 상태 및 첨부파일이 전무하거나 컴포넌트 락(Lock) 상태라면 예외 처리로 전송을 거부합니다.
  if (
    props.submitDisabled ||
    (!value && attachments.value.length === 0) ||
    props.disabled ||
    props.generating
  )
    return;

  const keyboardOpenOnSubmit = blurTextareaForMobileSubmit();
  const shouldCollapseAfterSubmit = isPromptExpanded.value;

  // 상위 부모 뷰(View) 인터페이스를 향해 수집된 핵심 프롬프트 메타데이터 세트를 실어 올립니다.
  handleComposerEvent("submit", {
    text: value, // 정문화된 유저 프롬프트 문자열
    attachments: attachments.value, // 최종 검증 통과된 업로드 파일 배열 본체
    promptTemplate: selectedTemplate.value, // 결합 적용된 프롬프트 기본 서식 명세 객체
    keyboardOpenOnSubmit, // 모바일 키보드가 열린 상태에서 전송했는지 여부. 전송 후 앵커 스크롤 보정에 사용합니다.
  });

  // [초기화 사이클] 전송이 성공적으로 접수 완료되었으므로, 다음 대화를 위해 입력 폼 상태를 완전히 비워줍니다.
  clearText(); // 입력란 초기화
  clearAttachments(); // 첨부파일 큐 초기화
  speech.resetToMic(); // STT 마이크 모드 정상 상태 원복
  closeMenus(); // 열려 있던 모든 도구창 닫기 처리

  // 최대화 상태에서 전송한 경우에는 전송 접수 직후 입력창을 자동 최소화합니다.
  // 최소화 복구는 기존 auto-grow 복원 루틴을 재사용해 일반 입력창 높이/스크롤 규칙으로 되돌립니다.
  if (shouldCollapseAfterSubmit) {
    isPromptExpanded.value = false;
    nextTick(() => {
      restoreTextareaAutoGrow();
      nextTick(() => handleComposerEvent("height-change", getLastHeight()));
    });
    return;
  }

  nextTick(resize); // 늘어나 있던 입력창 높이를 원래 1줄 규격 스타일로 깔끔하게 복원
}

/**
 * [클립보드 붙여넣기 래퍼] 사용자가 입력창 내부에서 Ctrl+V 등으로 외부 미디어나 텍스트를 붙여 넣을 때 작동하는 가드 핸들러입니다.
 * @param {ClipboardEvent} event - 브라우저 네이티브 클립보드 붙여넣기 이벤트 객체
 */
function handlePaste(event) {
  if (props.submitDisabled || props.hideAttachActions) return;
  // 텍스트 서브 모듈 유틸을 통해 클립보드 내 바이트 스트림 데이터(이미지 파일 등)를 먼저 확보합니다.
  const files = getRawPastedFiles(event);
  // 확보된 이미지나 스크린샷 캡처 파일 객체가 실재한다면 즉시 첨부 파일 업로드 큐에 가동 주입합니다.
  if (files && files.length) addFiles(files);
}

function applyPromptExpandedState(expanded) {
  isPromptExpanded.value = Boolean(expanded);
  closeMenus();

  nextTick(() => {
    if (isPromptExpanded.value) {
      resize();
    } else {
      restoreTextareaAutoGrow();
    }
    handleComposerEvent("height-change", getLastHeight());
  });
}

function togglePromptExpanded() {
  applyPromptExpandedState(!isPromptExpanded.value);
}

function collapsePromptExpanded() {
  if (!isPromptExpanded.value) return;
  applyPromptExpandedState(false);
}

// ── [생명주기 마운트] ────────────────────────────────────────────────────
// 실제 DOM 트리가 기기 브라우저에 최종 활성화 안착한 시점에 최초 동기화 세팅을 구동합니다.
// orientationchange 및 window.visualViewport 이벤트 추적은 usePromptMenu의 syncViewportMode 리스너에서 전담합니다.
onMounted(() => {
  syncViewportMode(); // 현재 접속한 해상도가 PC 규격인지 Mobile 규격인지 1차 분석 완료 고정
  resize(); // 초기 기본 1줄 상태 폼 레이아웃 드로잉 스펙 고정
});

// 부모 템플릿 마크업 HTML 영역 내부에서 단 한 번의 구조 분해로 연결 바인딩할 수 있도록 모든 API 인터페이스 자원을 최종 추출 반환합니다.

const floating = computed(() => props.floating);
const showHelp = computed(() => props.showHelp);
const placeholder = computed(() => props.placeholder);
const modelValue = computed(() => props.modelValue);
const modelReadonly = computed(() => props.modelReadonly);
const promptExpandToggleLabel = computed(() =>
  isPromptExpanded.value ? t("chat.inputCollapse") : t("chat.inputExpand")
);

watch(
  isPromptExpanded,
  async (expanded) => {
    if (typeof document !== "undefined") {
      document.body.classList.toggle("prompt-input-expanded", expanded);
    }
    emit("expanded-change", expanded);

    await nextTick();

    if (expanded) {
      resize();
    } else {
      restoreTextareaAutoGrow();
    }

    await nextTick();
    emit("height-change", getLastHeight());
  },
  {flush: "post", immediate: true}
);

onBeforeUnmount(() => {
  if (typeof document !== "undefined") {
    document.body.classList.remove("prompt-input-expanded");
  }
  emit("expanded-change", false);
});

const usesDesktopTopActions = computed(() => !isMobileSheet.value);
const promptLayoutMode = computed(() =>
  isMobileSheet.value ? "mobile" : "desktop"
);
watch(
  isMobileSheet,
  async () => {
    closeMenus();

    await nextTick();

    if (isPromptExpanded.value) {
      resize();
    } else {
      restoreTextareaAutoGrow();
    }

    await nextTick();
    handleComposerEvent("height-change", getLastHeight());
  },
  {flush: "post"}
);

provide(PROMPT_TEXTAREA_STATE_KEY, {
  text,
  placeholder: computed(() => placeholder.value || t("chat.promptPlaceholder")),
  disabled: computed(() => Boolean(props.disabled)),
  generating: computed(() => Boolean(props.generating)),
  canSubmit,
  expanded: computed(() => Boolean(isPromptExpanded.value)),
  layoutMode: promptLayoutMode,
});

provide(
  PROMPT_TOOLBAR_STATE_KEY,
  computed(() => ({
    disabled: actionDisabled.value,
    modelReadonly: props.modelReadonly,
    modelValue: props.modelValue,
    currentModel: currentModel.value,
    models: currentModels.value,
    selectedTemplateTool: selectedTemplateTool.value,
    attachOptions: attachOptions.value,
    modelMenuOpen: modelMenuOpen.value,
    toolMenuOpen: toolMenuOpen.value,
    attachMenuOpen: attachMenuOpen.value,
    isMobileSheet: isMobileSheet.value,
    canSubmit: canSubmit.value,
    hasPromptText: hasPromptText.value,
    hideToolActions: componentProps.hideToolActions,
    hideAttachActions: componentProps.hideAttachActions,
    hideVoiceAction: componentProps.hideVoiceAction,
    isMicEnabled: isMicEnabled.value,
    isVoiceListening: isVoiceListening.value,
    hasVoiceStopped: hasVoiceStopped.value,
    generating: props.generating,
    isSpeechSupported: isSpeechSupported.value,
    voiceStartLabel: t("chat.voiceStart"),
    voiceStopLabel: t("chat.voiceStop"),
    attachLabel: t("chat.attach"),
    sendLabel: t("chat.send"),
    modelSelectLabel: t("chat.modelSelect"),
    readonlyTitle: t("chat.modelReadonly"),
  }))
);

defineExpose({
  setText,
  collapsePromptExpanded,
});
</script>

<style scoped lang="scss">
/* The base prompt border is component-owned; browser/keyboard patches remain global. */
.prompt-box,
.prompt-box--gemini {
  border: 1px solid var(--prompt-border);
}

:global(body.mobile-mode) .prompt-box,
:global(body.mobile-mode) .prompt-box--gemini {
  border: 1px solid var(--prompt-border);
}

.prompt-box--file-dragging {
  outline: 2px dashed var(--prompt-border);
  outline-offset: 4px;
}

.prompt-box--file-dragging::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--app-prompt);
  opacity: 0.72;
  pointer-events: none;
  z-index: 2;
}

.prompt-box--file-dragging > * {
  position: relative;
  z-index: 3;
}
</style>
