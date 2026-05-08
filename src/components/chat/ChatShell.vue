<template>
  <div
    class="chatgpt-shell"
    :class="{'chatgpt-shell--keyboard-open': keyboardOpen, 'chatgpt-shell--sidebar-collapsed': sidebarCollapsed}"
  >
    <ChatSidebar
      :histories="histories"
      :projects="projects"
      :active-project-id="activeProjectId"
      v-model:sidebar-collapsed="sidebarCollapsed"
      v-model:drawer-open="drawerOpen"
      v-model:collapsed-recent-open="collapsedRecentOpen"
      @new-chat="startNewChat"
      @select-history="loadHistory"
      @select-history-collapsed="loadHistoryFromCollapsed"
    />

    <main class="chat-workspace">
      <ChatHeader
        v-model="selectedModel"
        :models="models"
        :theme-name="themeName"
        @open-drawer="drawerOpen = true"
        @toggle-theme="toggleTheme"
        @open-swagger="openSwagger"
      />

      <section v-if="messages.length === 0" class="empty-stage">
        <div class="empty-center">
          <h1>어디서부터 시작할까요?</h1>
          <PromptInput
            class="desktop-center-prompt"
            :disabled="isGenerating"
            :show-help="false"
            @submit="handleSubmit"
            @focus="handlePromptFocus"
            @height-change="handlePromptResize"
          />
          <div class="suggestion-row">
            <button
              v-for="item in suggestions"
              :key="item.text"
              class="suggestion-chip"
              type="button"
              @click="handleSubmit(item.prompt)"
            >
              <span>{{ item.icon }}</span>
              {{ item.text }}
            </button>
          </div>
        </div>

        <div class="mobile-project-home">
          <div class="project-title">
            <span class="folder-icon" aria-hidden="true">▣</span>
            <h1>{{ activeProjectName }}</h1>
          </div>
          <button class="source-chip" type="button">소스</button>

          <div class="mobile-recent-list">
            <button
              v-for="item in histories"
              :key="item.id"
              class="mobile-recent-card"
              type="button"
              @click="loadHistory(item)"
            >
              <strong>{{ item.title }}</strong>
              <span>{{ item.preview }}</span>
            </button>
          </div>
        </div>
      </section>

      <MessageList
        v-else
        ref="listRef"
        :messages="messages"
        :loading="isGenerating"
        @content-rendered="handleMessageContentRendered"
      />

      <div
        v-if="previewImage"
        class="image-preview-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="previewImage.name"
        @click="closeImagePreview"
      >
        <button type="button" class="image-preview-close" aria-label="닫기" @click.stop="closeImagePreview">×</button>
        <div class="image-preview-stage" @click.stop>
          <img class="image-preview-large" :src="previewImage.url" :alt="previewImage.name" />
        </div>
      </div>

      <PromptInput
        v-if="messages.length > 0"
        :disabled="isGenerating"
        :show-help="false"
        @submit="handleSubmit"
        @focus="handlePromptFocus"
        @height-change="handlePromptResize"
      />
      <PromptInput
        v-else
        class="mobile-bottom-prompt"
        :disabled="isGenerating"
        :show-help="false"
        floating
        @submit="handleSubmit"
        @focus="handlePromptFocus"
        @height-change="handlePromptResize"
      />
    </main>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";
import {useRouter} from "vue-router";
import {useAppContext} from "@/composables/useAppContext";
import {streamText} from "@/utils/fakeStream";
import {loadMarkdownShowcase} from "@/utils/markdownSamples";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {createId} from "@/utils/id";
import {addMediaQueryListener} from "@/utils/dom";
import {useAutoScroll} from "@/composables/useAutoScroll";
import {useViewportGuard} from "@/composables/useViewportGuard";
import ChatHeader from "./ChatHeader.vue";
import ChatSidebar from "./ChatSidebar.vue";
import MessageList from "./MessageList.vue";
import PromptInput from "./PromptInput.vue";

const router = useRouter();
const {theme} = useAppContext();
const listRef = ref(null);
const {scrollToBottom} = useAutoScroll(listRef);
const {keyboardOpen, refreshViewport} = useViewportGuard({
  onChange: ({isCompact, keyboardOpen: isKeyboardOpen}) => {
    if (isCompact && isKeyboardOpen) {
      scrollBottom({stable: true});
    }
  },
});
const isGenerating = ref(false);
const themeName = ref(theme.current);
const drawerOpen = ref(false);
const sidebarCollapsed = ref(false);
const collapsedRecentOpen = ref(false);
const selectedModel = ref("gpt-5-thinking");
const activeProjectId = ref(1);
let removeMobileMediaQueryListener = null;
let forceBottomUntil = 0;

const models = [
  {
    id: "gpt-5-thinking",
    label: "ChatGPT",
    description: "GPT-5.5 Thinking 스타일 데모",
  },
  {id: "instant", label: "Instant", description: "빠른 답변용 UI 모드"},
  {id: "coding", label: "Coding", description: "개발 작업에 맞춘 모드"},
];

const projects = [
  {id: 1, name: "ds assistant"},
  {id: 2, name: "radar"},
  {id: 3, name: "IOS"},
];

const histories = ref([
  {
    id: 1,
    title:
      "Vue 슬롯 vs 컴포넌트 구조 비교 및 실제 프로젝트에서의 활용 방법과 유지보수 관점에서의 차이점 분석",
    preview:
      "그럼 웹은 위와 같이 한다고 하면 모바일 버전에서는 슬롯을 활용하는 방식이 더 적합한지 아니면 컴포넌트 분리를 통해 구조를 유지하는 것이 좋은지에 대해서 실제 사례를 기반으로 설명해줄 수 있을까 테스트용 긴 문장입니다",
  },
  {
    id: 2,
    title:
      "Compose vs Fragment 비교 및 상태 관리 흐름과 UI 재구성 시 장단점에 대한 상세 분석",
    preview:
      "그럼 이런거는 엄청 좋네 a값이 변경되면 자동으로 b가 변경되고 다시 c로 이어지는 구조가 가능하다는 건데 이게 실제로 성능적으로 문제가 없는지 그리고 recomposition 과정에서 비용은 얼마나 발생하는지 궁금하다 테스트용 긴 문장입니다",
  },
  {
    id: 3,
    title:
      "Option API에서 Composition API로 마이그레이션 시 고려사항 및 코드 구조 개선 전략",
    preview:
      "지금 위의 업로드 코드는 node_modules까지 추가되어 있는데 이걸 기준으로 Composition API로 완전히 전환했을 때 생길 수 있는 사이드 이펙트나 유지보수 측면에서의 문제점은 무엇인지 테스트용 긴 문장입니다",
  },
  {
    id: 4,
    title:
      "Android vs React Native MVVM 아키텍처 비교 및 실제 프로젝트 적용 시 차이점",
    preview:
      "그럼 내 상황 말고 다른 프레임워크나 다른 시스템도 동일하게 MVVM 구조를 적용할 수 있는지 그리고 Native와 Hybrid 구조에서의 성능 차이는 어느 정도인지 테스트용 긴 문장입니다",
  },
  {
    id: 5,
    title: "npm 캐시 동기화 문제 원인 분석 및 개발 환경별 차이 해결 방법",
    preview:
      "그리고 이건 다른 얘기인데 개발 인터뷰 질문자로 이력서를 봤을 때 특정 기술 스택을 계속 바꿔온 개발자에 대한 평가 기준은 어떻게 가져가야 하는지 테스트용 긴 문장입니다",
  },
  {
    id: 6,
    title:
      "웹앱 인터뷰 질문 구성 및 실제 서비스 환경에서의 코드 설계 방식 검증",
    preview:
      "이거 이러지 말고 그냥 component 클래스를 하나 만들어서 공통으로 사용하는게 더 좋은 구조 아닌지 그리고 실제로 그렇게 했을 때 확장성은 어떻게 되는지 테스트용 긴 문장입니다",
  },
  {
    id: 7,
    title: "Spring Boot 응답 처리 구조 개선 및 공통 Response Wrapper 설계 전략",
    preview:
      "traceId는 위험해서 일단 제거하고 외부에서 받아도 된다고 했을 때 전체 응답 구조를 통합하는 방법과 exception 처리까지 포함해서 어떻게 설계해야 하는지 테스트용 긴 문장입니다",
  },
  {
    id: 8,
    title:
      "Vue reactivity 내부 동작 원리 및 Proxy 기반 반응성 시스템 상세 분석",
    preview:
      "내가 알기로는 vue3에서 reactive로 선언된 변수에 새로운 객체를 할당하면 반응성이 깨질 수 있다고 들었는데 실제로는 어떤 상황에서 문제가 발생하는지 테스트용 긴 문장입니다",
  },
  {
    id: 50,
    type: "markdown-showcase",
    title:
      "Markdown 통합 렌더링 50가지 샘플: KaTeX, LaTeX, Code Block, Table, Mermaid, 외부 링크",
    preview:
      "채팅방을 열면 unified 기반 Markdown 샘플 50가지를 확인할 수 있습니다. 수식, 코드블록, 표 래퍼, Mermaid, 외부 링크와 조합 예제가 포함됩니다.",
  },
]);

const messages = ref([]);
const previewImage = ref(null);
const activeProjectName = computed(
  () =>
    projects.find((project) => project.id === activeProjectId.value)?.name ||
    "ds assistant"
);

const suggestions = [
  {
    icon: "▧",
    text: "이미지 만들기",
    prompt: "이미지 생성 화면의 UI 구조를 제안해줘",
  },
  {
    icon: "✎",
    text: "글쓰기 또는 편집",
    prompt: "Vue Composition API 코드 리팩토링 기준을 정리해줘",
  },
  {
    icon: "◎",
    text: "필요한 항목 찾기",
    prompt: "프로젝트에서 resolver에 추가할 항목을 알려줘",
  },
];

function isCompactViewport() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(max-width: 900px)")?.matches ||
    window.innerWidth <= 900
  );
}

function markForceBottom(duration = 1800) {
  forceBottomUntil = Date.now() + duration;
}

function shouldKeepForceBottom() {
  return Date.now() <= forceBottomUntil;
}

async function scrollBottom(options = {}) {
  await scrollToBottom(options);
}

function handleMessageContentRendered() {
  if (shouldKeepForceBottom()) {
    scrollBottom({force: true, stable: true});
  }
}

function handlePromptFocus() {
  refreshViewport();
  if (isCompactViewport()) {
    scrollBottom({force: true, stable: true});
    return;
  }

  scrollBottom({stable: true});
}

function handlePromptResize() {
  if (isCompactViewport()) {
    scrollBottom({force: true, stable: true});
    return;
  }

  scrollBottom({stable: true});
}

function closeDrawerOnViewportChange() {
  drawerOpen.value = false;
  collapsedRecentOpen.value = false;
}

function revokeMessageAttachments(items = messages.value) {
  items.forEach((message) => {
    if (!Array.isArray(message.attachments)) return;
    message.attachments.forEach((file) => {
      if (file?.url?.startsWith?.('blob:')) {
        URL.revokeObjectURL(file.url);
      }
    });
  });
}

async function startNewChat() {
  revokeMessageAttachments();
  messages.value = [];
  drawerOpen.value = false;
  collapsedRecentOpen.value = false;
  forceBottomUntil = 0;
}

async function loadHistoryFromCollapsed(item) {
  collapsedRecentOpen.value = false;
  await loadHistory(item);
}

async function loadHistory(item) {
  revokeMessageAttachments();

  if (item.type === "markdown-showcase") {
    await loadShowcaseConversation();
    drawerOpen.value = false;
    markForceBottom();
    scrollBottom({behavior: "auto", force: true, stable: true});
    return;
  }

  messages.value = [
    {id: createId("message"), role: "user", content: item.title},
    {
      id: createId("message"),
      role: "assistant",
      content: `${item.preview}\n\n이 화면은 저장된 대화를 선택했을 때의 샘플입니다. 실제 API나 저장소 없이 UI/UX 흐름만 재현합니다.`,
    },
  ];
  drawerOpen.value = false;
  markForceBottom(1000);
  scrollBottom({force: true, stable: true});
}

async function toggleTheme() {
  theme.toggle();
  themeName.value = theme.current;
  await nextTick();
  await renderMermaidInElement(document.querySelector(".message-list"), {
    force: true,
  });
  scrollBottom({stable: true});
}

function openSwagger() {
  router.push("/swagger");
}

function normalizePromptPayload(payload) {
  if (typeof payload === "string") {
    return {text: payload.trim(), attachments: []};
  }

  return {
    text: String(payload?.text || "").trim(),
    attachments: Array.isArray(payload?.attachments) ? payload.attachments : [],
  };
}

function openImagePreview(event) {
  previewImage.value = event.detail;
}

function closeImagePreview() {
  previewImage.value = null;
}


async function handleSubmit(payload) {
  const {text: value, attachments} = normalizePromptPayload(payload);
  if ((!value && attachments.length === 0) || isGenerating.value) return;

  messages.value.push({
    id: createId("message"),
    role: "user",
    content: value,
    attachments,
  });
  const assistantMessage = {
    id: createId("message"),
    role: "assistant",
    content: "",
  };
  messages.value.push(assistantMessage);
  isGenerating.value = true;
  scrollBottom({force: true, stable: true});

  const response = createDemoResponse(value, attachments);
  await streamText(response, (chunk) => {
    assistantMessage.content = chunk;
    scrollBottom({stable: true});
  });

  isGenerating.value = false;
  scrollBottom({stable: true});
}

function createDemoResponse(prompt, attachments = []) {
  return `# Markdown 응답 샘플

입력한 내용: **${prompt || "첨부 파일만 전송"}**

${attachments.length ? `첨부 파일 ${attachments.length}개를 확인했습니다. 이미지 파일은 대화 화면에서 ChatGPT처럼 크게 보기로 확인할 수 있습니다.
` : ""}

현재 선택된 모델은 **${
    models.find((model) => model.id === selectedModel.value)?.label
  }** 입니다.

## 지원 기능

- **KaTeX / LaTeX**: $E = mc^2$, $$\\int_0^1 x^2 dx = \\frac{1}{3}$$
- **Code Block**

\`\`\`js
const message = 'unified markdown renderer'
console.log(message)
\`\`\`

- **Table Wrapper**

| 기능 | 처리 방식 |
| --- | --- |
| Table | rehypeTableWrapper |
| Link | rehypeExternalLinks |

- **외부 링크**: https://vuejs.org
- **Mermaid**

\`\`\`mermaid
graph TD
  A[User Markdown] --> B[Unified]
  B --> C[Vue v-html]
  C --> D[Mermaid post render]
\`\`\`

실제 전체 50개 유형 샘플은 사이드바의 마지막 최근 대화 \`Markdown 통합 렌더링 50가지 샘플\`을 선택하면 \`public/samples/markdown-showcase.md\` 파일 내용으로 표시됩니다.`;
}

async function loadShowcaseConversation() {
  const markdown = await loadMarkdownShowcase();
  messages.value = [
    {
      id: createId("message"),
      role: "user",
      content: "Markdown 통합 렌더링 50가지 유형 샘플 채팅방을 열어줘",
    },
    {
      id: createId("message"),
      role: "assistant",
      content: markdown,
    },
  ];
}

onMounted(async () => {
  drawerOpen.value = false;
  collapsedRecentOpen.value = false;
  const mobileMediaQuery = window.matchMedia?.("(max-width: 900px)");
  removeMobileMediaQueryListener = addMediaQueryListener(
    mobileMediaQuery,
    closeDrawerOnViewportChange
  );
  window.addEventListener("resize", closeDrawerOnViewportChange);
  window.addEventListener("chat:image-preview", openImagePreview);
});

onBeforeUnmount(() => {
  revokeMessageAttachments();
  removeMobileMediaQueryListener?.();
  window.removeEventListener("resize", closeDrawerOnViewportChange);
  window.removeEventListener("chat:image-preview", openImagePreview);
});
</script>
