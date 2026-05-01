<template>
  <div class="chat-shell">
    <aside v-if="features.sidebar" class="sidebar">
      <div class="brand">
        <div class="brand-logo">✦</div>
        <div>
          <strong>Vue Chat</strong>
          <small>{{ platformLabel }}</small>
        </div>
      </div>

      <button class="new-chat" type="button" @click="resetChat">＋ 새 대화</button>

      <div class="history-list">
        <button v-for="item in histories" :key="item.id" class="history-item" type="button">
          <span>{{ item.title }}</span>
          <small>{{ item.time }}</small>
        </button>
      </div>
    </aside>

    <main class="chat-main">
      <ChatHeader :theme-name="themeName" @toggle-theme="toggleTheme" />
      <MessageList ref="listRef" :messages="messages" :loading="isGenerating" />
      <PromptInput :disabled="isGenerating" @submit="handleSubmit" />
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useAppContext } from '@/composables/useAppContext'
import { streamText } from '@/utils/fakeStream'
import ChatHeader from './ChatHeader.vue'
import MessageList from './MessageList.vue'
import PromptInput from './PromptInput.vue'

const { platform, features, theme } = useAppContext()
const listRef = ref(null)
const isGenerating = ref(false)
const themeName = ref(theme.current)

const histories = ref([
  { id: 1, title: 'Vue 플랫폼 Resolver 설계', time: '오늘' },
  { id: 2, title: '모달/슬롯 구조 정리', time: '어제' },
  { id: 3, title: 'Android WebView UI', time: '이번 주' }
])

const messages = ref([
  {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: '안녕하세요. 이 샘플은 **API 통신 없이** ChatGPT 스타일 UI/UX를 재현한 Vue 3 Composition API + Webpack 프로젝트입니다.\n\n- 플랫폼 resolver\n- bootstrap 시작 구조\n- 라이트/다크 테마 변수\n- 모바일 반응형 레이아웃\n- 가짜 스트리밍 응답\n\n메시지를 입력해보세요.'
  }
])

const platformLabel = computed(() => {
  if (platform === 'android') return 'Android WebView'
  if (platform === 'mobile-web') return 'Mobile Layout'
  return 'Desktop Web'
})

function scrollBottom() {
  nextTick(() => listRef.value?.scrollToBottom?.())
}

function resetChat() {
  messages.value = [
    { id: crypto.randomUUID(), role: 'assistant', content: '새 대화를 시작합니다. 무엇을 도와드릴까요?' }
  ]
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
  return `입력한 내용: **${prompt}**\n\n현재 프로젝트 구조에서는 실제 API 없이도 UI/UX를 확인할 수 있습니다.\n\n\`src/core/bootstrap.js\`에서 앱 시작을 담당하고, resolver들이 플랫폼별 설정을 base + override 방식으로 처리합니다.\n\n추후 실제 API를 붙일 때는 \`resolveApi\`와 \`resolveAxios\`만 확장하면 됩니다.`
}

onMounted(scrollBottom)
</script>
