<template>
  <ChatHeader
    :mode="mode"
    :assistant-label="assistantLabel"
    :assistant="assistant"
    :conversation-title="conversationTitle"
    :theme-name="themeName"
  />

  <MessageList
    v-show="!isPromptExpandedInChat"
    ref="listRef"
    :messages="messages"
    :loading="isGenerating"
    :auto-scroll-on-answer="autoScrollOnAnswer"
    :history-rendering="isHistoryRendering"
    :history-messages-ready="historyMessagesLoaded"
    @content-rendered="handleMessageContentRendered"
    @history-rendered="handleHistoryRendered"
    @regenerate="workspaceActions.regenerate($event)"
  />
  <button
    v-if="
      showScrollBottom &&
      !isInteractionBlocked &&
      !isPromptExpandedInChat &&
      !isHistoryRendering
    "
    class="scroll-bottom-button"
    type="button"
    :aria-label="t('chat.scrollBottom')"
    @click="workspaceActions.scrollBottom()"
  >
    ↓
  </button>
  <div
    v-show="!isHistoryRendering"
    ref="composerSlotRef"
    class="chat-composer-slot"
    :aria-hidden="isHistoryRendering ? 'true' : null"
  >
    <ChatReadonlyInput v-if="readonly" />
    <ChatReadonlyInput
      v-else-if="isActiveModelUnavailable"
      :variant="isActiveModelDeleted ? 'deleted-model' : 'unavailable-model'"
    />
    <PromptComposer
      v-else
      ref="promptComposerRef"
      :class="{'mobile-chat-prompt': isMobile}"
      @expanded-change="handlePromptExpandedChange"
    />
  </div>

  <aside
    v-if="showCodeInterpreterPanel"
    class="code-interpreter-preview-panel"
    :aria-label="t('chat.codeInterpreter.panelTitle')"
  >
    <div class="code-interpreter-preview-panel__header">
      <div>
        <span class="code-interpreter-preview-panel__eyebrow">
          {{ t("chat.codeInterpreter.eyebrow") }}
        </span>
        <strong>{{ t("chat.codeInterpreter.panelTitle") }}</strong>
      </div>
      <button
        class="code-interpreter-preview-panel__close"
        type="button"
        :aria-label="t('chat.codeInterpreter.close')"
        @click="closeCodeInterpreterPanel"
      >
        ×
      </button>
    </div>
    <div
      ref="previewRef"
      class="code-interpreter-preview-panel__body code-interpreter-markdown-body markdown-body"
      v-html="previewHtml"
    ></div>
  </aside>
</template>

<script setup>
/**
 * @file components/workspace/ChatConversationWorkspace.vue
 * @description 기존 통합 채팅 workspace의 대화방 렌더링만 분리한 라우트 전용 workspace입니다.
 */
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import {useI18n} from "vue-i18n";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import ChatReadonlyInput from "@/components/chat/ChatReadonlyInput.vue";
import MessageList from "@/components/chat/MessageList.vue";
import PromptComposer from "@/components/prompt/PromptComposer.vue";
import {
  CHAT_WORKSPACE_STATE_KEY,
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceActions,
  createEmptyWorkspaceState,
} from "@/composables/chat/chatActionContext";
import {useInteractionGuard} from "@/composables/runtime/useInteractionGuard";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import {useChatStore} from "@/stores/chatStore";

const {locale, t} = useI18n();
const listRef = ref(null);
const composerSlotRef = ref(null);
const promptComposerRef = ref(null);
const previewRef = ref(null);
const previewHtml = ref("<p></p>");
const isDesktopRuntime = ref(false);
const codeInterpreterOpen = ref(false);
const isPromptExpandedInChat = ref(false);
const selectedInterpreterCode = ref("");
const selectedInterpreterLanguage = ref("text");
let composerResizeObserver = null;
let codeInterpreterBodyClassObserver = null;
let composerHeightTimerIds = [];
let composerHeightRafId = 0;

const workspaceState = inject(
  CHAT_WORKSPACE_STATE_KEY,
  computed(createEmptyWorkspaceState)
);
const workspaceActions = inject(
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceActions()
);
const {isInteractionBlocked} = useInteractionGuard();
const chatStore = useChatStore();

const mode = computed(() => workspaceState.value.mode);
const activeChatId = computed(() => chatStore.selectedChatId || "");
const readonly = computed(() => workspaceState.value.readonly);
const isMobile = computed(() => workspaceState.value.isMobile);
const assistantLabel = computed(() => workspaceState.value.assistantLabel);
const assistant = computed(() => workspaceState.value.assistant);
const conversationTitle = computed(
  () => workspaceState.value.conversationTitle
);
const themeName = computed(() => workspaceState.value.themeName);
const isActiveModelDeleted = computed(
  () => workspaceState.value.isActiveModelDeleted
);
const isActiveModelUnavailable = computed(
  () => workspaceState.value.isActiveModelUnavailable
);
const isGenerating = computed(() => workspaceState.value.isGenerating);
const messages = computed(() => workspaceState.value.messages || []);
const showScrollBottom = computed(() => workspaceState.value.showScrollBottom);
const autoScrollOnAnswer = computed(
  () => workspaceState.value.autoScrollOnAnswer
);
const isHistoryRendering = computed(
  () => workspaceState.value.isHistoryRendering
);
const historyMessagesLoaded = computed(
  () => workspaceState.value.historyMessagesLoaded
);
const canUseDesktopCodeInterpreter = computed(
  () => isDesktopRuntime.value && !isMobile.value && mode.value === "chat"
);
const showCodeInterpreterPanel = computed(
  () => canUseDesktopCodeInterpreter.value && codeInterpreterOpen.value
);
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildInterpreterLineItems(count, label) {
  return Array.from({length: count}, (_, index) => {
    const number = index + 1;
    return `<li>${escapeHtml(label)} ${number}: ${escapeHtml(
      locale.value === "en"
        ? "placeholder result for scroll verification and future execution output."
        : "스크롤 검증과 추후 실행 결과 출력을 위한 자리입니다."
    )}</li>`;
  }).join("");
}

function buildCodeInterpreterPreviewHtml() {
  const language = selectedInterpreterLanguage.value || "text";
  const code = selectedInterpreterCode.value || "";
  const escapedLanguage = escapeHtml(language);
  const escapedCode = escapeHtml(
    code ||
      (locale.value === "en"
        ? "No code block has been selected yet."
        : "아직 선택된 코드 블록이 없습니다.")
  );

  if (locale.value === "en") {
    return `<article class="code-interpreter-sample">
      <h2>Code Interpreter Sample</h2>
      <p>This PC-only panel renders a markdown-style preview from the code block selected in the chat code toolbar. The input remains unchanged at the bottom of the left chat area, and the right panel closes automatically when the layout switches to mobile.</p>
      <h3>Selected code</h3>
      <pre class="code-interpreter-sample__code" data-language="${escapedLanguage}"><code>${escapedCode}</code></pre>
      <h3>Current state</h3>
      <ul>
        <li><strong>Language:</strong> <code>${escapedLanguage}</code></li>
        <li><strong>Panel mode:</strong> right-side markdown preview</li>
        <li><strong>Chat area:</strong> preserved on the left</li>
        <li><strong>Input area:</strong> unchanged at the bottom of the chat lane</li>
        <li><strong>Execution status:</strong> UI sample only. Backend execution is not connected yet.</li>
      </ul>
      <h3>Sample result</h3>
      <p>The selected code block is ready for future execution, comparison, or generated markdown output. This sample avoids wide tables so the right panel remains stable on desktop widths.</p>
      <h4>Planned output sections</h4>
      <ol>
        <li>Standard output preview</li>
        <li>Error output preview</li>
        <li>Runtime metadata</li>
        <li>Generated markdown report</li>
        <li>Comparison against the original answer</li>
        <li>Downloadable file or chart preview</li>
      </ol>
      <h4>Validation notes</h4>
      <ul>
        <li>The code block inside this panel does not show interpreter or copy toolbar actions.</li>
        <li>The right panel body owns its own OverlayScrollbars instance when content is long.</li>
        <li>When the panel is closed, the main chat returns to the normal page-level browser scroll.</li>
        <li>When this panel is open, the left chat lane owns its own conversation scroll.</li>
      </ul>
      <h4>Long scroll sample</h4>
      <p>The following lines are intentionally long enough to verify independent panel scrolling without forcing Korean or English text into narrow vertical columns.</p>
      <ul>${buildInterpreterLineItems(18, "Additional result line")}</ul>
    </article>`;
  }

  return `<article class="code-interpreter-sample">
    <h2>코드 인터프리터 샘플</h2>
    <p>이 PC 전용 패널은 채팅 본문의 코드 블록 툴바에서 선택한 코드를 기준으로 마크다운 형태의 미리보기 화면을 렌더링합니다. 입력창은 좌측 채팅 영역 하단에 그대로 유지되고, 모바일 화면으로 전환되면 우측 패널은 자동으로 닫힙니다.</p>
    <h3>선택된 코드</h3>
    <pre class="code-interpreter-sample__code" data-language="${escapedLanguage}"><code>${escapedCode}</code></pre>
    <h3>현재 상태</h3>
    <ul>
      <li><strong>언어:</strong> <code>${escapedLanguage}</code></li>
      <li><strong>패널 모드:</strong> 우측 마크다운 미리보기</li>
      <li><strong>채팅 영역:</strong> 좌측에 기존 대화 유지</li>
      <li><strong>input 영역:</strong> 좌측 채팅 하단에 기존 그대로 유지</li>
      <li><strong>실행 상태:</strong> 현재는 UI 샘플이며 실제 백엔드 실행은 아직 연결하지 않았습니다.</li>
    </ul>
    <h3>샘플 결과</h3>
    <p>선택한 코드 블록은 추후 실행, 비교 화면, 생성된 마크다운 결과 화면으로 연결할 수 있는 준비 상태입니다. 우측 패널이 좁아질 때 글자가 세로로 찢어지는 문제를 막기 위해 넓은 표 대신 일반 문단과 목록 중심으로 구성했습니다.</p>
    <h4>예정 출력 영역</h4>
    <ol>
      <li>표준 출력 미리보기</li>
      <li>오류 출력 미리보기</li>
      <li>실행 메타데이터</li>
      <li>생성된 마크다운 리포트</li>
      <li>기존 답변과의 비교 결과</li>
      <li>다운로드 파일 또는 차트 미리보기</li>
    </ol>
    <h4>검증 포인트</h4>
    <ul>
      <li>이 패널 내부의 코드 블록에는 인터프리터 버튼과 복사 버튼이 표시되지 않습니다.</li>
      <li>내용이 길어지면 우측 패널 본문에서 독립적으로 OverlayScrollbars가 동작합니다.</li>
      <li>패널이 닫힌 상태에서는 기존처럼 전체 화면 기준 브라우저 스크롤을 사용합니다.</li>
      <li>패널이 열린 상태에서는 좌측 채팅 lane이 자체 대화 스크롤을 가집니다.</li>
    </ul>
    <h4>긴 스크롤 샘플</h4>
    <p>아래 내용은 우측 패널의 스크롤 동작을 확인하기 위해 일부러 길게 구성했습니다. 한국어와 영어 문장이 좁은 세로 열로 찢어지지 않고 읽기 쉬운 폭을 유지해야 합니다.</p>
    <ul>${buildInterpreterLineItems(18, "추가 결과")}</ul>
  </article>`;
}

function openCodeInterpreterPanel(event) {
  syncCodeInterpreterPanelWithViewport();
  if (!canUseDesktopCodeInterpreter.value) return;
  updateCodeInterpreterChatWidth();
  selectedInterpreterCode.value = String(event?.detail?.code || "");
  selectedInterpreterLanguage.value = String(event?.detail?.language || "text");
  previewHtml.value = buildCodeInterpreterPreviewHtml();
  codeInterpreterOpen.value = true;
  nextTick(() => {
    updateCodeInterpreterChatWidth();
    scrollChatWorkspaceToStart();
  });
}

function closeCodeInterpreterPanel() {
  codeInterpreterOpen.value = false;
}

function getChatWorkspaceElement() {
  return (
    composerSlotRef.value?.closest?.(".chat-workspace") ||
    listRef.value?.$el?.closest?.(".chat-workspace") ||
    null
  );
}

function updateCodeInterpreterChatWidth() {
  const workspace = getChatWorkspaceElement();
  if (!workspace || typeof window === "undefined") return;

  const composerWidth =
    composerSlotRef.value?.getBoundingClientRect?.().width || 0;
  const workspaceWidth = workspace.clientWidth || 0;
  const horizontalPadding = 48;
  const fallbackWidth = Math.max(0, workspaceWidth - horizontalPadding);
  const baseWidth = showCodeInterpreterPanel.value
    ? fallbackWidth || composerWidth
    : composerWidth || fallbackWidth;
  const measuredWidth = Math.round(
    Math.min(880, Math.max(420, baseWidth || 880))
  );

  workspace.style.setProperty(
    "--code-interpreter-chat-width",
    `${measuredWidth}px`
  );
}

function scrollChatWorkspaceToStart() {
  const workspace = getChatWorkspaceElement();
  if (!workspace || typeof workspace.scrollTo !== "function") return;
  workspace.scrollTo({left: 0, behavior: "auto"});
}

function updateDesktopRuntimeFlag() {
  if (typeof document === "undefined") {
    isDesktopRuntime.value = !isMobile.value;
    return;
  }
  const body = document.body;
  isDesktopRuntime.value = Boolean(
    body?.classList?.contains("desktop-mode") &&
    !body?.classList?.contains("mobile-mode") &&
    !body?.classList?.contains("actual-android-runtime")
  );
}

function syncCodeInterpreterPanelWithViewport() {
  updateDesktopRuntimeFlag();
  if (typeof document === "undefined") return;
  const body = document.body;
  const shouldClose =
    isMobile.value ||
    body?.classList?.contains("mobile-mode") ||
    body?.classList?.contains("actual-android-runtime") ||
    !body?.classList?.contains("desktop-mode");
  if (shouldClose) {
    closeCodeInterpreterPanel();
    return;
  }
}

function syncCodeInterpreterBodyClass() {
  if (typeof document === "undefined") return;
  document.body.classList.toggle(
    "code-interpreter-panel-open",
    Boolean(showCodeInterpreterPanel.value)
  );
}

function handleCodeInterpreterViewportChange() {
  syncCodeInterpreterPanelWithViewport();
  if (showCodeInterpreterPanel.value) {
    updateCodeInterpreterChatWidth();
    scrollChatWorkspaceToStart();
  }
}

function observeCodeInterpreterRuntimeClasses() {
  if (
    typeof document === "undefined" ||
    typeof MutationObserver === "undefined"
  )
    return;
  codeInterpreterBodyClassObserver?.disconnect?.();
  codeInterpreterBodyClassObserver = new MutationObserver(() => {
    handleCodeInterpreterViewportChange();
    syncCodeInterpreterBodyClass();
  });
  codeInterpreterBodyClassObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

function cleanupCodeInterpreterRuntimeClasses() {
  codeInterpreterBodyClassObserver?.disconnect?.();
  codeInterpreterBodyClassObserver = null;
}

async function renderCodeInterpreterPreview() {
  previewHtml.value = buildCodeInterpreterPreviewHtml();
  await nextTick();
  codeInterpreterScrollbar.update();
  if (typeof window !== "undefined") {
    window.setTimeout(() => codeInterpreterScrollbar.update(), 0);
    window.setTimeout(() => codeInterpreterScrollbar.update(), 120);
  }
}

function updateComposerHeight() {
  const height = composerSlotRef.value?.offsetHeight || 0;
  document.documentElement.style.setProperty(
    "--chat-composer-height",
    `${Math.max(height, 72)}px`
  );
}

function clearComposerHeightSchedule() {
  composerHeightTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  composerHeightTimerIds = [];
  if (composerHeightRafId) {
    window.cancelAnimationFrame(composerHeightRafId);
    composerHeightRafId = 0;
  }
}

function scheduleComposerHeightUpdate() {
  if (typeof window === "undefined") {
    updateComposerHeight();
    return;
  }

  clearComposerHeightSchedule();
  composerHeightRafId = window.requestAnimationFrame(() => {
    composerHeightRafId = 0;
    updateComposerHeight();
  });

  if (isHistoryRendering.value) {
    return;
  }

  // 긴 대화방에서 창 크기 변경 시 composer ResizeObserver와 watch가 동시에
  // 연쇄 실행되면 reflow가 누적됩니다. 마지막 프레임 근처에서만 높이를
  // 갱신하고, streaming/resize 상태 변화는 짧은 보정 타이머로 유지합니다.
  composerHeightTimerIds = [80, 160].map((delay) =>
    window.setTimeout(updateComposerHeight, delay)
  );
}

function handlePromptExpandedChange(expanded) {
  isPromptExpandedInChat.value = Boolean(expanded);
  scheduleComposerHeightUpdate();
}

function collapsePromptExpandedForChatSwitch() {
  promptComposerRef.value?.collapsePromptExpanded?.();
  if (isPromptExpandedInChat.value) {
    isPromptExpandedInChat.value = false;
  }
  scheduleComposerHeightUpdate();
}

function handleMessageContentRendered() {
  if (isHistoryRendering.value) {
    return;
  }

  workspaceActions.handleMessageContentRendered();
  scheduleComposerHeightUpdate();
}

function handleHistoryRendered() {
  workspaceActions.handleHistoryRendered();
  scheduleComposerHeightUpdate();
}

function observeComposerHeight() {
  if (!composerSlotRef.value) return;
  updateComposerHeight();
  if (typeof ResizeObserver !== "undefined") {
    composerResizeObserver = new ResizeObserver(scheduleComposerHeightUpdate);
    composerResizeObserver.observe(composerSlotRef.value);
  }
}

function cleanupComposerHeightObserver() {
  clearComposerHeightSchedule();
  composerResizeObserver?.disconnect();
  composerResizeObserver = null;
}

const codeInterpreterScrollbar = useOverlayScrollbar(
  previewRef,
  {overflow: {x: "hidden", y: "scroll"}},
  {
    enabled: () => showCodeInterpreterPanel.value,
    watchSource: () => [showCodeInterpreterPanel.value, previewHtml.value],
  }
);

onMounted(async () => {
  await nextTick();
  updateDesktopRuntimeFlag();
  observeCodeInterpreterRuntimeClasses();
  observeComposerHeight();
  if (typeof window !== "undefined") {
    window.addEventListener(
      "ds-code-interpreter-open",
      openCodeInterpreterPanel
    );
    window.addEventListener("resize", handleCodeInterpreterViewportChange, {
      passive: true,
    });
    window.addEventListener(
      "orientationchange",
      handleCodeInterpreterViewportChange,
      {passive: true}
    );
  }
  syncCodeInterpreterPanelWithViewport();
});

onBeforeUnmount(() => {
  cleanupComposerHeightObserver();
  cleanupCodeInterpreterRuntimeClasses();
  isPromptExpandedInChat.value = false;
  if (typeof document !== "undefined") {
    document.body.classList.remove("code-interpreter-panel-open");
  }
  if (typeof window !== "undefined") {
    window.removeEventListener(
      "ds-code-interpreter-open",
      openCodeInterpreterPanel
    );
    window.removeEventListener("resize", handleCodeInterpreterViewportChange);
    window.removeEventListener(
      "orientationchange",
      handleCodeInterpreterViewportChange
    );
  }
});

watch(
  () => [
    readonly.value,
    mode.value,
    showScrollBottom.value,
    isActiveModelUnavailable.value,
    isGenerating.value,
    isHistoryRendering.value,
    messages.value.length,
    showCodeInterpreterPanel.value,
    isDesktopRuntime.value,
  ],
  async () => {
    await nextTick();
    scheduleComposerHeightUpdate();
  }
);

watch(
  () => [
    selectedInterpreterLanguage.value,
    selectedInterpreterCode.value,
    locale.value,
    showCodeInterpreterPanel.value,
  ],
  async () => {
    syncCodeInterpreterBodyClass();
    if (!showCodeInterpreterPanel.value) return;
    await renderCodeInterpreterPreview();
    await nextTick();
    updateCodeInterpreterChatWidth();
    scrollChatWorkspaceToStart();
    scheduleComposerHeightUpdate();
  },
  {immediate: true}
);

watch(isMobile, () => {
  handleCodeInterpreterViewportChange();
  syncCodeInterpreterBodyClass();
});

watch(isDesktopRuntime, () => {
  handleCodeInterpreterViewportChange();
  syncCodeInterpreterBodyClass();
});

watch(mode, () => {
  if (mode.value !== "chat") {
    closeCodeInterpreterPanel();
  }
});

watch(activeChatId, () => {
  closeCodeInterpreterPanel();
  collapsePromptExpandedForChatSwitch();
});

defineExpose({
  listRef,
});
</script>

<style scoped lang="scss">
/* 기존 대화방 composer 모바일 보정은 대화방 workspace가 소유합니다. */
:global(body.mobile-mode) .mobile-chat-prompt {
  width: 100%;
  max-width: none;
}

:global(body.mobile-mode) .mobile-chat-prompt :deep(.prompt-box--gemini) {
  align-items: stretch;
}

:global(body.mobile-mode) .mobile-chat-prompt :deep(.prompt-action-row) {
  display: flex;
  width: 100%;
  min-width: 0;
  align-self: stretch;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

:global(body.mobile-mode) .mobile-chat-prompt :deep(.prompt-left-actions) {
  display: flex;
  flex: 0 1 auto;
  width: auto;
  min-width: 0;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  margin: 0;
}

:global(body.mobile-mode) .mobile-chat-prompt :deep(.send-button),
:global(body.mobile-mode) .mobile-chat-prompt :deep(.voice-button) {
  flex: 0 0 auto;
}
</style>
