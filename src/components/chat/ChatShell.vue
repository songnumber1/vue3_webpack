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
      <div v-if="drawerOpen" class="mobile-drawer-backdrop" @click="drawerOpen = false"></div>
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
        <div class="desktop-empty-actions">
          <button class="top-icon" type="button" title="프로필">♙</button>
          <button class="top-icon" type="button" title="설정" @click="toggleTheme">◐</button>
        </div>

        <div class="empty-center">
          <h1>어디서부터 시작할까요?</h1>
          <PromptInput
            class="desktop-center-prompt"
            :disabled="isGenerating"
            :show-help="false"
            @submit="handleSubmit"
          />
          <div class="suggestion-row">
            <button v-for="item in suggestions" :key="item.text" class="suggestion-chip" type="button" @click="handleSubmit(item.prompt)">
              <span>{{ item.icon }}</span>
              {{ item.text }}
            </button>
          </div>
        </div>

        <div class="mobile-project-home">
          <div class="project-title">
            <span class="folder-icon">▱</span>
            <h1>{{ activeProjectName }}</h1>
          </div>
          <button class="source-chip" type="button">소스</button>

          <div class="mobile-recent-list">
            <button v-for="item in histories" :key="item.id" class="mobile-recent-card" type="button" @click="loadHistory(item)">
              <strong>{{ item.title }}</strong>
              <span>{{ item.preview }}</span>
            </button>
          </div>
        </div>
      </section>

      <MessageList v-else ref="listRef" :messages="messages" :loading="isGenerating" />

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
import { computed, defineComponent, h, nextTick, onMounted, ref } from 'vue'
import { useAppContext } from '@/composables/useAppContext'
import { streamText } from '@/utils/fakeStream'
import ChatHeader from './ChatHeader.vue'
import MessageList from './MessageList.vue'
import PromptInput from './PromptInput.vue'

const SidebarContent = defineComponent({
  name: 'SidebarContent',
  props: {
    histories: { type: Array, required: true },
    projects: { type: Array, required: true },
    activeProjectId: { type: Number, required: true },
    mobile: { type: Boolean, default: false }
  },
  emits: ['new-chat', 'select-history', 'close'],
  setup(props, { emit }) {
    return () => h('div', { class: ['sidebar-content', props.mobile ? 'sidebar-content--mobile' : ''] }, [
      h('div', { class: 'sidebar-top' }, [
        h('div', { class: 'sidebar-title' }, 'ChatGPT'),
        h('div', { class: 'sidebar-top-actions' }, [
          props.mobile ? h('button', { class: 'sidebar-round', type: 'button', onClick: () => emit('close'), title: '닫기' }, '×') : h('button', { class: 'sidebar-round', type: 'button', title: '접기' }, '◐'),
          props.mobile ? h('button', { class: 'sidebar-round', type: 'button', title: '검색' }, '⌕') : null
        ])
      ]),
      h('nav', { class: 'quick-menu' }, [
        h('button', { class: 'quick-item active', type: 'button', onClick: () => emit('new-chat') }, [h('span', '✎'), '새 채팅']),
        h('button', { class: 'quick-item', type: 'button' }, [h('span', '⌕'), '채팅 검색']),
        h('button', { class: 'quick-item', type: 'button' }, [h('span', '⌬'), 'Codex']),
        h('button', { class: 'quick-item', type: 'button' }, [h('span', '⋯'), '더 보기'])
      ]),
      h('div', { class: 'section-label' }, '프로젝트'),
      h('div', { class: 'project-list' }, [
        h('button', { class: 'project-item new-project', type: 'button' }, [h('span', '▱＋'), '새 프로젝트']),
        ...props.projects.map((project) => h('button', {
          class: ['project-item', project.id === props.activeProjectId ? 'selected' : ''],
          type: 'button'
        }, [h('span', '▱'), project.name])),
        h('button', { class: 'project-item', type: 'button' }, [h('span', '⋯'), '모든 프로젝트'])
      ]),
      h('div', { class: 'section-label' }, '최근'),
      h('div', { class: 'sidebar-history' }, props.histories.map((item) => h('button', {
        class: 'sidebar-history-item',
        type: 'button',
        onClick: () => emit('select-history', item)
      }, item.title))),
      props.mobile ? h('button', { class: 'mobile-new-chat-fab', type: 'button', onClick: () => emit('new-chat') }, [h('span', '✎'), '채팅']) : null,
      h('div', { class: 'sidebar-user' }, [h('div', { class: 'user-avatar' }, '민'), h('div', [h('strong', '민우 송'), h('small', 'Plus')])])
    ])
  }
})

const { platform, theme } = useAppContext()
const listRef = ref(null)
const isGenerating = ref(false)
const themeName = ref(theme.current)
const drawerOpen = ref(false)
const selectedModel = ref('gpt-5-thinking')
const activeProjectId = ref(1)

const models = [
  { id: 'gpt-5-thinking', label: 'ChatGPT', description: 'GPT-5.5 Thinking 스타일 데모' },
  { id: 'instant', label: 'Instant', description: '빠른 답변용 UI 모드' },
  { id: 'coding', label: 'Coding', description: '개발 작업에 맞춘 모드' }
]

const projects = [
  { id: 1, name: 'ds assistant' },
  { id: 2, name: 'radar' },
  { id: 3, name: 'IOS' }
]

const histories = ref([
  { id: 1, title: 'Vue 슬롯 vs 컴포넌트', preview: '그럼 웹은 위와 같이 한다고 하면 모바일 버전에서는...' },
  { id: 2, title: 'Compose vs Fragment 비교', preview: '그럼 이런거는 엄청 좋네 a값이 변경되면 자동으로...' },
  { id: 3, title: 'Option to Composition API 수정', preview: '지금 위의 업로드 코드는 node_modules까지 추가...' },
  { id: 4, title: 'Android vs React Native MVVM', preview: '그럼 내 상황 말고 다른 프레임워크나 다른 시스템도 ...' },
  { id: 5, title: 'npm 캐시 동기화 문제', preview: '그리고 이건 다른 얘기인데 개발 인터뷰 질문자로 이...' },
  { id: 6, title: '웹앱 인터뷰 질문', preview: '이거 이러지 말고 그냥 component 클래스를 하나...' },
  { id: 7, title: 'Spring Boot 응답 처리', preview: 'traceId는 위험해서 일단 제거하고 외부에서 받아도 ...' },
  { id: 8, title: 'Vue reactivity 차이', preview: '내가 알기로는 vue3에서 reactive로 선언된...' }
])

const messages = ref([])
const activeProjectName = computed(() => projects.find((project) => project.id === activeProjectId.value)?.name || 'ds assistant')

const suggestions = [
  { icon: '▧', text: '이미지 만들기', prompt: '이미지 생성 화면의 UI 구조를 제안해줘' },
  { icon: '✎', text: '글쓰기 또는 편집', prompt: 'Vue Composition API 코드 리팩토링 기준을 정리해줘' },
  { icon: '◎', text: '필요한 항목 찾기', prompt: '프로젝트에서 resolver에 추가할 항목을 알려줘' }
]

function scrollBottom() {
  nextTick(() => listRef.value?.scrollToBottom?.())
}

function startNewChat() {
  messages.value = []
  drawerOpen.value = false
  scrollBottom()
}

function loadHistory(item) {
  messages.value = [
    { id: crypto.randomUUID(), role: 'user', content: item.title },
    { id: crypto.randomUUID(), role: 'assistant', content: `${item.preview}\n\n이 화면은 저장된 대화를 선택했을 때의 샘플입니다. 실제 API나 저장소 없이 UI/UX 흐름만 재현합니다.` }
  ]
  drawerOpen.value = false
  scrollBottom()
}

function toggleTheme() {
  theme.toggle()
  themeName.value = theme.current
}

async function handleSubmit(text) {
  const value = text.trim()
  if (!value || isGenerating.value) return

  messages.value.push({ id: crypto.randomUUID(), role: 'user', content: value })
  const assistantMessage = { id: crypto.randomUUID(), role: 'assistant', content: '' }
  messages.value.push(assistantMessage)
  isGenerating.value = true
  scrollBottom()

  const response = createDemoResponse(value)
  await streamText(response, (chunk) => {
    assistantMessage.content = chunk
    scrollBottom()
  })

  isGenerating.value = false
  scrollBottom()
}

function createDemoResponse(prompt) {
  return `입력한 내용: **${prompt}**\n\n현재 선택된 모델은 **${models.find((model) => model.id === selectedModel.value)?.label}** 입니다.\n\n이 프로젝트는 실제 API 통신 없이 ChatGPT 스타일의 웹/모바일 UI를 재현합니다.\n\n- 웹: 좌측 고정 사이드바 + 중앙 시작 화면\n- 모바일: 좌측 Drawer 메뉴 + 상단 모델 선택 + 하단 고정 입력창\n- 공통: Vue 3 Composition API, bootstrap/resolver 구조, CSS variable 테마\n\n실제 API 연동은 \`src/core/resolver/api.js\`와 \`src/core/resolver/axios.js\`를 확장하면 됩니다.`
}

onMounted(scrollBottom)
</script>
