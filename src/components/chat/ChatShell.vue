<template>
  <div class="chatgpt-shell">
    <aside class="desktop-sidebar">
      <SidebarContent
        :histories="histories"
        :projects="projects"
        :active-project-id="activeProjectId"
        @new-chat="startNewChat"
        @select-history="loadHistory"
      />
    </aside>

    <transition name="drawer-fade">
      <div
        v-if="drawerOpen"
        class="mobile-drawer-backdrop"
        @click="drawerOpen = false"
      ></div>
    </transition>
    <transition name="drawer-slide">
      <aside v-if="drawerOpen" class="mobile-drawer">
        <SidebarContent
          :histories="histories"
          :projects="projects"
          :active-project-id="activeProjectId"
          mobile
          @new-chat="startNewChat"
          @select-history="loadHistory"
          @close="drawerOpen = false"
        />
      </aside>
    </transition>

    <main class="chat-workspace">
      <ChatHeader
        v-model="selectedModel"
        :models="models"
        :theme-name="themeName"
        @open-drawer="drawerOpen = true"
        @toggle-theme="toggleTheme"
      />

      <section v-if="messages.length === 0" class="empty-stage">
        <div class="empty-center">
          <h1>어디서부터 시작할까요?</h1>
          <PromptInput
            class="desktop-center-prompt"
            :disabled="isGenerating"
            :show-help="false"
            @submit="handleSubmit"
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
            <SvgIcon name="folder" class="folder-icon" />
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
      />

      <PromptInput
        v-if="messages.length > 0"
        :disabled="isGenerating"
        :show-help="false"
        @submit="handleSubmit"
      />
      <PromptInput
        v-else
        class="mobile-bottom-prompt"
        :disabled="isGenerating"
        :show-help="false"
        floating
        @submit="handleSubmit"
      />
    </main>
  </div>
</template>

<script setup>
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";
import {useAppContext} from "@/composables/useAppContext";
import {streamText} from "@/utils/fakeStream";
import ChatHeader from "./ChatHeader.vue";
import MessageList from "./MessageList.vue";
import PromptInput from "./PromptInput.vue";

const ICONS = {
  pencil:
    '<path d="M4 16.5V20h3.5L18.1 9.4 14.6 5.9 4 16.5Z"/><path d="M13.4 7.1 16.9 10.6"/>',
  search: '<circle cx="10.5" cy="10.5" r="5.8"/><path d="M15 15 20 20"/>',
  cube: '<path d="M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3Z"/><path d="m4.8 7.4 7.2 4.1 7.2-4.1"/><path d="M12 11.5V21"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  folder:
    '<path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4.1l2.1 2.4H18a2.5 2.5 0 0 1 2.5 2.5v6.6A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z"/>',
  project: '<path d="M5 7.5h14l-2 9H3l2-9Z"/>',
};

const SvgIcon = defineComponent({
  name: "SvgIcon",
  props: {name: {type: String, required: true}},
  setup(props) {
    return () =>
      h("svg", {
        class: "nav-icon",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        innerHTML: ICONS[props.name] || ICONS.project,
        "aria-hidden": "true",
      });
  },
});

function icon(name) {
  return h("span", {class: "icon-wrap"}, [h(SvgIcon, {name})]);
}

const SidebarContent = defineComponent({
  name: "SidebarContent",
  props: {
    histories: {type: Array, required: true},
    projects: {type: Array, required: true},
    activeProjectId: {type: Number, required: true},
    mobile: {type: Boolean, default: false},
  },
  emits: ["new-chat", "select-history", "close"],
  setup(props, {emit}) {
    return () =>
      h(
        "div",
        {
          class: [
            "sidebar-content",
            props.mobile ? "sidebar-content--mobile" : "",
          ],
        },
        [
          h("div", {class: "sidebar-top"}, [
            h("div", {class: "sidebar-title"}, "ChatGPT"),
            props.mobile
              ? h("div", {class: "sidebar-top-actions"}, [
                  h(
                    "button",
                    {
                      class: "sidebar-round",
                      type: "button",
                      onClick: () => emit("close"),
                      title: "닫기",
                    },
                    "×"
                  ),
                ])
              : null,
          ]),
          h("nav", {class: "quick-menu"}, [
            h(
              "button",
              {
                class: "quick-item active",
                type: "button",
                onClick: () => emit("new-chat"),
              },
              [icon("pencil"), "새 채팅"]
            ),
            h("button", {class: "quick-item", type: "button"}, [
              icon("search"),
              "채팅 검색",
            ]),
            h("button", {class: "quick-item", type: "button"}, [
              icon("cube"),
              "Codex",
            ]),
            h("button", {class: "quick-item", type: "button"}, [
              icon("more"),
              "더 보기",
            ]),
          ]),
          h("div", {class: "section-label"}, "프로젝트"),
          h("div", {class: "project-list"}, [
            h("button", {class: "project-item new-project", type: "button"}, [
              icon("plus"),
              "새 프로젝트",
            ]),
            ...props.projects.map((project) =>
              h(
                "button",
                {
                  class: [
                    "project-item",
                    project.id === props.activeProjectId ? "selected" : "",
                  ],
                  type: "button",
                },
                [icon("folder"), project.name]
              )
            ),
            h("button", {class: "project-item", type: "button"}, [
              icon("more"),
              "모든 프로젝트",
            ]),
          ]),
          h("div", {class: "section-label"}, "최근"),
          h(
            "div",
            {class: "sidebar-history"},
            props.histories.map((item) =>
              h(
                "button",
                {
                  class: "sidebar-history-item",
                  type: "button",
                  onClick: () => emit("select-history", item),
                },
                item.title
              )
            )
          ),
          props.mobile
            ? h(
                "button",
                {
                  class: "mobile-new-chat-fab",
                  type: "button",
                  onClick: () => emit("new-chat"),
                },
                [icon("pencil"), "채팅"]
              )
            : null,
          h("div", {class: "sidebar-user"}, [
            h("div", {class: "user-avatar"}, "민"),
            h("div", [h("strong", "민우 송"), h("small", "Plus")]),
          ]),
        ]
      );
  },
});

const {theme} = useAppContext();
const listRef = ref(null);
const isGenerating = ref(false);
const themeName = ref(theme.current);
const drawerOpen = ref(false);
const selectedModel = ref("gpt-5-thinking");
const activeProjectId = ref(1);
let mobileMediaQuery = null;

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
]);

const messages = ref([]);
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

function scrollBottom() {
  nextTick(() => listRef.value?.scrollToBottom?.());
}

function closeDrawerOnViewportChange() {
  drawerOpen.value = false;
}

function startNewChat() {
  messages.value = [];
  drawerOpen.value = false;
  scrollBottom();
}

function loadHistory(item) {
  messages.value = [
    {id: crypto.randomUUID(), role: "user", content: item.title},
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `${item.preview}\n\n이 화면은 저장된 대화를 선택했을 때의 샘플입니다. 실제 API나 저장소 없이 UI/UX 흐름만 재현합니다.`,
    },
  ];
  drawerOpen.value = false;
  scrollBottom();
}

function toggleTheme() {
  theme.toggle();
  themeName.value = theme.current;
}

async function handleSubmit(text) {
  const value = text.trim();
  if (!value || isGenerating.value) return;

  messages.value.push({id: crypto.randomUUID(), role: "user", content: value});
  const assistantMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "",
  };
  messages.value.push(assistantMessage);
  isGenerating.value = true;
  scrollBottom();

  const response = createDemoResponse(value);
  await streamText(response, (chunk) => {
    assistantMessage.content = chunk;
    scrollBottom();
  });

  isGenerating.value = false;
  scrollBottom();
}

function createDemoResponse(prompt) {
  return `입력한 내용: **${prompt}**\n\n현재 선택된 모델은 **${
    models.find((model) => model.id === selectedModel.value)?.label
  }** 입니다.\n\n이 프로젝트는 실제 API 통신 없이 ChatGPT 스타일의 웹/모바일 UI를 재현합니다.\n\n- 웹: 좌측 고정 사이드바 + 중앙 시작 화면\n- 모바일: 좌측 Drawer 메뉴 + 상단 모델 선택 + 하단 고정 입력창\n- 공통: Vue 3 Composition API, bootstrap/resolver 구조, CSS variable 테마\n\n실제 API 연동은 \`src/core/resolver/api.js\`와 \`src/core/resolver/axios.js\`를 확장하면 됩니다.`;
}

onMounted(() => {
  drawerOpen.value = false;
  mobileMediaQuery = window.matchMedia?.("(max-width: 900px)");
  mobileMediaQuery?.addEventListener?.("change", closeDrawerOnViewportChange);
  window.addEventListener("resize", closeDrawerOnViewportChange);
  scrollBottom();
});

onBeforeUnmount(() => {
  mobileMediaQuery?.removeEventListener?.(
    "change",
    closeDrawerOnViewportChange
  );
  window.removeEventListener("resize", closeDrawerOnViewportChange);
});
</script>
