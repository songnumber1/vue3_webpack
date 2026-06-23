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
      <PromptAttachmentPreviewList
        v-if="!usesDesktopTopActions"
        :attachments="attachments"
        @preview="previewImage"
        @remove="removeAttachment"
        @preview-error="markPreviewError"
      />

      <PromptTemplatePanel
        :visible="hasSelectedTemplatePanel"
        :is-mobile-sheet="isMobileSheet"
        :groups="selectedTemplateGroups"
        :active-mobile-group="activeMobileGroup"
        :is-option-active="isTemplateOptionActive"
        @select-option="selectTemplateOption"
        @open-mobile-group="openTemplateOptionSheet"
        @close-mobile-group="closeTemplateOptionSheet"
      />

      <div
        v-if="usesDesktopTopActions"
        class="prompt-desktop-top-row tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-2"
      >
        <PromptToolbarDesktop
          ref="toolbarRef"
          layout-mode="top-actions"
          class="prompt-toolbar-desktop-top"
          @open-model="openModelSelector"
          @open-tool="openToolSelector"
          @open-attach="openAttachSelector"
          @select-model="selectModel"
          @apply-tool="applyTool"
          @open-file-picker="openFilePicker"
        />
        <button
          class="prompt-expand-toggle prompt-expand-toggle--desktop-row"
          type="button"
          :title="promptExpandToggleLabel"
          :aria-label="promptExpandToggleLabel"
          :aria-pressed="isPromptExpanded"
          @click="togglePromptExpanded"
        >
          <svg v-if="!isPromptExpanded" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M9 3v6H3M15 3v6h6M21 15h-6v6M3 15h6v6"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <PromptAttachmentPreviewList
        v-if="usesDesktopTopActions"
        class="prompt-attachment-preview--desktop-top-actions"
        :attachments="attachments"
        @preview="previewImage"
        @remove="removeAttachment"
        @preview-error="markPreviewError"
      />

      <button
        v-else
        class="prompt-expand-toggle"
        type="button"
        :title="promptExpandToggleLabel"
        :aria-label="promptExpandToggleLabel"
        :aria-pressed="isPromptExpanded"
        @click="togglePromptExpanded"
      >
        <svg v-if="!isPromptExpanded" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M9 3v6H3M15 3v6h6M21 15h-6v6M3 15h6v6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <PromptTextarea
        ref="textareaComponentRef"
        @focus="handleFocus"
        @blur="emit('blur')"
        @input="resize"
        @submit="submit"
        @paste="handlePaste"
      />

      <PromptSubmitActions
        v-if="usesDesktopTopActions"
        layout-mode="submit-only"
        class="prompt-toolbar-desktop-submit"
        @start-voice="startVoiceInput"
        @stop-voice="stopVoiceInput"
      />

      <component
        :is="resolvedToolbarComponent"
        v-else
        ref="toolbarRef"
        @open-model="openModelSelector"
        @open-tool="openToolSelector"
        @open-attach="openAttachSelector"
        @select-model="selectModel"
        @apply-tool="applyTool"
        @open-file-picker="openFilePicker"
        @start-voice="startVoiceInput"
        @stop-voice="stopVoiceInput"
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

    <PromptMobileBottomSheets
      :model-open="modelMenuOpen && isMobileSheet"
      :tool-open="toolMenuOpen && isMobileSheet"
      :attach-open="attachMenuOpen && isMobileSheet"
      :models="currentModels"
      :tools="tools"
      :model-value="modelValue"
      :attach-options="attachOptions"
      :tool-title="t('chat.tools')"
      :model-title="t('chat.modelSelect')"
      :attach-title="t('chat.attach')"
      @close-model="modelMenuOpen = false"
      @close-tool="toolMenuOpen = false"
      @close-attach="attachMenuOpen = false"
      @select-model="selectModel"
      @apply-tool="applyTool"
      @open-file-picker="openFilePicker"
    />
  </footer>
</template>

<script setup>
/**
 * @file components/prompt/PromptComposer.vue
 * @description 프롬프트 입력 UI 컴포넌트입니다. Prompt 상태는 PROMPT_STATE_KEY로 주입받고, 내부 툴바 상태는 PROMPT_TOOLBAR_STATE_KEY로 제공합니다.
 */

import {computed, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, toRef, watch, inject} from "vue";
import PromptToolbarDesktop from "@/components/prompt/controls/PromptToolbarDesktop.vue";
import PromptToolbarMobile from "@/components/prompt/controls/PromptToolbarMobile.vue";
import PromptSubmitActions from "@/components/prompt/controls/PromptSubmitActions.vue";
import PromptAttachmentPreviewList from "@/components/prompt/controls/PromptAttachmentPreviewList.vue";
import PromptMobileBottomSheets from "@/components/prompt/controls/PromptMobileBottomSheets.vue";
import PromptTextarea from "@/components/prompt/controls/PromptTextarea.vue";
import PromptTemplatePanel from "@/components/prompt/controls/PromptTemplatePanel.vue";
import {useI18n} from "vue-i18n";
import {usePromptMenu} from "@/composables/prompt/usePromptMenu";
import {usePromptText} from "@/composables/prompt/usePromptText";
import {usePromptAttachment} from "@/composables/prompt/usePromptAttachment";
import {usePromptSpeech} from "@/composables/prompt/usePromptSpeech";
import {usePromptModel} from "@/composables/prompt/usePromptModel";
import {usePromptTool} from "@/composables/prompt/usePromptTool";
import {usePromptTemplate} from "@/composables/prompt/usePromptTemplate";
import {useChatStore} from "@/stores/chatStore";
import {resolvePromptTemplateToolIcon} from "@/constants/toolIcons";
import {
  PROMPT_TEXTAREA_STATE_KEY,
  PROMPT_TOOLBAR_STATE_KEY,
  PROMPT_STATE_KEY,
  WORKSPACE_ACTIONS_KEY,
  createEmptyPromptState,
  createEmptyWorkspaceActions,
} from "@/composables/chat/chatActionContext";

const componentProps = defineProps({
  submitDisabled: {type: Boolean, default: false},
  hideToolActions: {type: Boolean, default: false},
  hideAttachActions: {type: Boolean, default: false},
  hideVoiceAction: {type: Boolean, default: false},
});

const promptState = inject(PROMPT_STATE_KEY, computed(createEmptyPromptState));
const workspaceActions = inject(WORKSPACE_ACTIONS_KEY, createEmptyWorkspaceActions());
const resolvedToolbarComponent = computed(() => PromptToolbarMobile);
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

const emit = defineEmits(["blur", "expanded-change"]);

function handleComposerEvent(eventName, payload) {
  if (eventName === "submit") {
    if (componentProps.submitDisabled) return;
    workspaceActions.submit(payload);
    return;
  }
  if (eventName === "open-tool" || eventName === "apply-tool") {
    if (componentProps.hideToolActions) return;
  }
  if (eventName === "open-attach" || eventName === "open-file-picker") {
    if (componentProps.hideAttachActions) return;
  }
  if (eventName === "start-voice" || eventName === "stop-voice") {
    if (componentProps.hideVoiceAction) return;
  }
  if (eventName === "update:modelValue") {
    workspaceActions.updateSelectedModel(payload);
    return;
  }
  if (eventName === "focus") {
    workspaceActions.handlePromptFocus();
    return;
  }
  if (eventName === "height-change") {
    workspaceActions.handlePromptResize();
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

// 3. 모델 변경 시 활성화된 템플릿 설정을 초기화하기 위해 전역 채팅 Pinia 스토어를 로드합니다.
const chatStore = useChatStore();

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
const isPromptExpanded = ref(false);

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
} = usePromptText({isMobileSheet, emit: handleComposerEvent, isExpanded: isPromptExpanded});

// ── [첨부 파일] ─────────────────────────────────────────────────────────
// 이미지, 문서 등의 물리 미디어 파일을 드롭다운 메뉴나 운영체제 탐색기를 통해 수집하는 파트입니다.
const {
  fileInputRef, // <input type="file" /> 실제 숨김 노드 접근용 Vue Ref
  fileDropZoneRef, // 파일 드래그앤드롭 이벤트를 수신할 입력 박스 루트 DOM Ref
  isFileDragging, // 현재 파일이 입력 박스 위로 드래그되고 있는지 여부
  isFileDropDisabled, // 현재 모델/상태에서 파일 드롭이 차단되어 있는지 여부
  attachments, // 현재 업로드되어 프롬프트 전송을 대기 중인 파일 오브젝트들의 반응형 배열 (Ref)
  fileAccept, // 허용할 확장자 및 미디어 마임 타입 가이드 문자열 (예: "image/*,application/pdf")
  captureMode, // 모바일 카메라 촬영 연동 시 전면/후면 지시 속성값
  attachOptions, // 카메라 촬영, 갤러리 접근, 파일 탐색기 등 디바이스 맞춤형 선택지 구성 데이터
  openAttachSelector, // 모바일 전용 첨부 바텀시트 메뉴를 트리거하여 노출시키는 함수
  openFilePicker, // 네이티브/브라우저 표준 파일 선택 창을 활성화하는 함수
  handleFileChange, // 탐색기 선택 완료에 따른 실제 파일 스트림 가공 인젝션 리스너
  addFiles, // 클립보드 복사나 드래그 앤 드롭으로 들어온 파일들을 첨부 큐 배열에 밀어 넣는 함수
  markPreviewError, // 업로드된 썸네일 미리보기 렌더링 실패 시 에러 폴백 이미지로 대체하는 핸들러
  previewImage, // 현재 크게 보기 팝업 창에 올라간 대표 이미지 소스 컨텍스트
  removeAttachment, // 대기 열에서 특정 첨부 파일 인덱스를 제외(삭제)하는 기능 함수
  clearAttachments, // 전송 완결 등의 시점에 업로드 대기 배열을 완전히 비우는 청소 함수
} = usePromptAttachment({
  attachMenuOpen,
  resize,
  getLastHeight,
  emit: handleComposerEvent,
  disabled: attachmentDisabled,
  toggleMenu,
});

// ── [음성 입력] ─────────────────────────────────────────────────────────
// STT (Speech-to-Text) 기능을 연동하여 음성을 텍스트 프롬프트 문자열로 치환하는 영역입니다.
const {
  isMicEnabled, // 사용자가 마이크 장치 및 브라우저 오디오 보안 권한을 승인했는지 여부
  isVoiceListening, // 현재 실시간으로 사용자의 음성을 받아쓰고 있는 활성 상태인지 나타내는 플래그
  hasVoiceStopped, // 음성 인식이 도중에 침묵이나 시간 초과 등으로 자동 정지되었는지 여부
  isSpeechSupported, // 현재 사용자 브라우저 엔진이 표준 Web Speech API 규격을 지원하는 기기인지 판단 플래그
  speech, // 마이크 상태 값 복원 등 STT 코어 제어 인스턴스
  startVoiceInput, // 마이크 인식을 활성화하고 음성 수신 스트림을 켜는 함수
  stopVoiceInput, // 음성 인식을 수동으로 즉시 정지하고 종료하는 함수
} = usePromptSpeech({text, resize, closeMenus, disabled, focusTextarea});

// ── [모델 선택] ─────────────────────────────────────────────────────────
// 현재 어시스턴트에서 스위칭 가능한 LLM 백엔드 모델 라인업을 동기화하고 변경을 허용합니다.
const {currentModels, currentModel, openModelSelector, selectModel} =
  usePromptModel({
    props,
    modelMenuOpen,
    syncViewportMode,
    toggleMenu,
    emit: handleComposerEvent,
  });

// ── [툴 / 프롬프트 템플릿 선택] ───────────────────────────────────────────
// 특정 페르소나나 업무 서식이 가미된 프롬프트 문틀(Template) 및 확장 API 기능(Tool)을 조합합니다.
const {
  selectedTemplate, // 현재 사용자가 마킹 선택한 활성 프롬프트 템플릿 객체
  selectedTemplateGroups, // 카테고리(그룹)별로 분류된 선택 가능한 전체 템플릿 라인업 목록
  hasSelectedTemplatePanel, // 현재 특정 서식 서랍 컴포넌트 창이 화면에 노출되고 있는지 여부
  activeMobileGroup, // 모바일 화면에서 선택된 특정 카테고리 그룹 식별자
  isTemplateOptionActive, // 특정 개별 서식 옵션이 활성화되었는지 판별하는 뷰어 가이드 함수
  selectTemplateOption, // 특정 프롬프트 서식을 최종 선택하여 폼 지침으로 주입하는 함수
  openTemplateOptionSheet, // 모바일 환경 서식 템플릿 바텀시트를 개방하는 함수
  closeTemplateOptionSheet, // 모바일 서식 템플릿 바텀시트를 패쇄하는 함수
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
      chatStore.resetActivePromptTemplate();
    }
  }
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
  text.value = String(value || ""); // 값 갱신
  nextTick(() => {
    resize(); // 가상 DOM에 할당된 텍스트 길이를 판별하여 입력창 물리 높이 조정
    if (focus) focusTextarea(); // 옵션 만족 시 인풋 박스 내부로 포커스 강제 이동
  });
}

function getTextareaElement() {
  const exposed = textareaComponentRef.value;
  return (
    exposed?.textareaRef?.value ||
    exposed?.textareaRef ||
    exposed?.$el ||
    null
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
    workspaceActions.handlePromptResize();
  },
  {flush: "post"}
);

onBeforeUnmount(() => {
  if (typeof document !== "undefined") {
    document.body.classList.remove("prompt-input-expanded");
  }
  emit("expanded-change", false);
});

const usesDesktopTopActions = computed(() => !isMobileSheet.value);

provide(PROMPT_TEXTAREA_STATE_KEY, {
  text,
  placeholder: computed(() => placeholder.value || t("chat.promptPlaceholder")),
  disabled: computed(() => Boolean(props.disabled)),
  generating: computed(() => Boolean(props.generating)),
  canSubmit,
  expanded: computed(() => Boolean(isPromptExpanded.value)),
});

provide(
  PROMPT_TOOLBAR_STATE_KEY,
  computed(() => ({
    disabled: actionDisabled.value,
    modelReadonly: props.modelReadonly,
    modelValue: props.modelValue,
    currentModel: currentModel.value,
    models: currentModels.value,
    tools: tools.value,
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
