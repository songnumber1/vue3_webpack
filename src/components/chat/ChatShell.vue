<template>
  <div class="chatgpt-shell" :class="{'chatgpt-shell--keyboard-open': keyboardOpen, 'chatgpt-shell--sidebar-collapsed': sidebarCollapsed}">
    <ChatSidebar
      :histories="histories"
      :assistants="assistants"
      v-model:selected-assistant-id="selectedAssistantId"
      :active-history-id="activeHistoryId"
      v-model:sidebar-collapsed="sidebarCollapsed"
      v-model:drawer-open="drawerOpen"
      v-model:collapsed-recent-open="collapsedRecentOpen"
      @new-chat="startNewChat"
      @select-history="openHistory"
      @select-history-collapsed="openHistory"
    />

    <main class="chat-workspace">
      <ChatHeader
        :mode="mode"
        :is-mobile="isMobile"
        :assistant-label="currentAssistant.label"
        :conversation-title="activeHistory?.title || ''"
        :theme-name="themeName"
        @open-drawer="drawerOpen = true"
        @toggle-theme="toggleTheme"
        @open-swagger="openSwagger"
        @open-settings="openSettings"
        @open-assistant="openAssistantFromHeader"
      />

      <section v-if="mode === 'main'" class="empty-stage empty-stage--main">
        <div class="empty-center">
          <h1>어디서부터 시작할까요?</h1>
          <div class="suggestion-row suggestion-row--between">
            <button v-for="item in suggestions" :key="item.text" class="suggestion-chip" type="button" @click="handleSubmit(item.prompt)">
              <span>{{ item.icon }}</span>{{ item.text }}
            </button>
          </div>
          <PromptInput class="desktop-center-prompt" v-model="selectedModel" :models="models" :disabled="isGenerating" :show-help="false" @submit="handleSubmit" @focus="handlePromptFocus" @height-change="handlePromptResize" />
        </div>
      </section>

      <template v-else>
        <MessageList ref="listRef" :messages="messages" :loading="isGenerating" @content-rendered="handleMessageContentRendered" />
        <button v-if="showScrollBottom" class="scroll-bottom-button" type="button" aria-label="맨 아래로 이동" @click="scrollBottom({force: true, behavior: 'smooth', stable: true})">↓</button>
        <PromptInput v-model="selectedModel" :models="models" :disabled="isGenerating" :show-help="false" @submit="handleSubmit" @focus="handlePromptFocus" @height-change="handlePromptResize" />
      </template>

      <div v-if="previewImage" class="image-preview-backdrop" role="dialog" aria-modal="true" :aria-label="previewImage.name" @click="closeImagePreview">
        <button type="button" class="image-preview-close" aria-label="닫기" @click.stop="closeImagePreview">×</button>
        <div class="image-preview-stage" @click.stop>
          <div v-if="previewImage.loading" class="image-preview-loading" role="status">이미지를 불러오는 중입니다...</div>
          <div v-if="previewImage.error" class="image-preview-error" role="alert">이미지를 미리보기로 표시할 수 없습니다.</div>
          <img v-if="previewImage.url && !previewImage.error" :key="previewImage.url" class="image-preview-large" :class="{'image-preview-large--hidden': previewImage.loading}" :src="previewImage.url" :alt="previewImage.name" @load="handlePreviewLoad" @error="handlePreviewError" />
        </div>
      </div>
    </main>

    <BaseBottomSheet :open="assistantSheetOpen" title="Assistant 선택" @close="assistantSheetOpen = false">
      <button v-for="assistant in assistants" :key="assistant.id" class="bottom-sheet-option" :class="{active: assistant.id === selectedAssistantId}" type="button" @click="selectAssistantFromSheet(assistant.id)">
        <strong>{{ assistant.label }}</strong>
        <small>{{ assistant.description }}</small>
      </button>
    </BaseBottomSheet>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppContext } from '@/composables/useAppContext'
import { useChatRuntime } from '@/composables/useChatRuntime'
import { streamText } from '@/utils/fakeStream'
import { renderMermaidInElement } from '@/utils/mermaidRenderer'
import { createId } from '@/utils/id'
import { addMediaQueryListener } from '@/utils/dom'
import { useAutoScroll } from '@/composables/useAutoScroll'
import { useViewportGuard } from '@/composables/useViewportGuard'
import BaseBottomSheet from './BaseBottomSheet.vue'
import ChatHeader from './ChatHeader.vue'
import ChatSidebar from './ChatSidebar.vue'
import MessageList from './MessageList.vue'
import PromptInput from './PromptInput.vue'

const props = defineProps({ mode: { type: String, default: 'main' } })
const router = useRouter()
const route = useRoute()
const { theme } = useAppContext()
const runtime = useChatRuntime()
const { assistants, currentAssistant, histories, models, selectedAssistantId, selectedModel, ensureConversation, setConversation, getHistory, revokeMessageAttachments } = runtime

const listRef = ref(null)
const { scrollToBottom } = useAutoScroll(listRef)
const { keyboardOpen, refreshViewport } = useViewportGuard({ onChange: ({isCompact, keyboardOpen: isKeyboardOpen}) => { if (isCompact && isKeyboardOpen) scrollBottom({stable: true}) } })
const isGenerating = ref(false)
const themeName = ref(theme.current)
const drawerOpen = ref(false)
const sidebarCollapsed = ref(false)
const collapsedRecentOpen = ref(false)
const isMobile = ref(false)
const messages = ref([])
const previewImage = ref(null)
const showScrollBottom = ref(false)
const assistantSheetOpen = ref(false)
let removeMobileMediaQueryListener = null
let bottomStateTimer = 0
let forceBottomUntil = 0

const activeHistoryId = computed(() => props.mode === 'chat' ? route.params.id : null)
const activeHistory = computed(() => getHistory(activeHistoryId.value))

const suggestions = [
  { icon: '▧', text: '이미지 만들기', prompt: '이미지 생성 화면의 UI 구조를 제안해줘' },
  { icon: '✎', text: '글쓰기 또는 편집', prompt: 'Vue Composition API 코드 리팩토링 기준을 정리해줘' },
  { icon: '◎', text: '필요한 항목 찾기', prompt: '프로젝트에서 resolver에 추가할 항목을 알려줘' },
]

function updateMobileState() { isMobile.value = Boolean(window.matchMedia?.('(max-width: 900px)')?.matches || window.innerWidth <= 900 || document.querySelector('.app-shell--mobile')) }
function markForceBottom(duration = 1800) { forceBottomUntil = Date.now() + duration }
function shouldKeepForceBottom() { return Date.now() <= forceBottomUntil }
async function scrollBottom(options = {}) { await scrollToBottom(options); updateScrollBottomButton() }
function updateScrollBottomButton() { showScrollBottom.value = props.mode === 'chat' && Boolean(listRef.value && !listRef.value.isAtBottom?.()) }
function scheduleBottomStateCheck() { window.clearTimeout(bottomStateTimer); bottomStateTimer = window.setTimeout(updateScrollBottomButton, 80) }
function handleMessageContentRendered() { if (shouldKeepForceBottom()) scrollBottom({force: true, stable: true}); scheduleBottomStateCheck() }
function handlePromptFocus() { refreshViewport(); scrollBottom({stable: true, force: isMobile.value}) }
function handlePromptResize() { scrollBottom({stable: true, force: isMobile.value}) }

async function startNewChat() {
  revokeMessageAttachments(messages.value)
  messages.value = []
  drawerOpen.value = false
  collapsedRecentOpen.value = false
  forceBottomUntil = 0
  await router.push('/')
}

async function openHistory(item) {
  drawerOpen.value = false
  collapsedRecentOpen.value = false
  await router.push({ name: 'chat', params: { id: item.id } })
}

async function loadRouteConversation() {
  if (props.mode !== 'chat') {
    messages.value = []
    return
  }
  const history = getHistory(activeHistoryId.value)
  if (!history) {
    await router.replace('/')
    return
  }
  messages.value = await ensureConversation(history.id)
  markForceBottom()
  await nextTick()
  await scrollBottom({behavior: 'auto', force: true, stable: true})
}

async function toggleTheme() {
  theme.toggle()
  themeName.value = theme.current
  await nextTick()
  await renderMermaidInElement(document.querySelector('.message-list'), {force: true})
  scrollBottom({stable: true})
}
function openSwagger() { router.push('/swagger') }
function openSettings() { window.dispatchEvent(new CustomEvent('chat:settings-open')) }
function openAssistantFromHeader() { assistantSheetOpen.value = true }
function selectAssistantFromSheet(id) { selectedAssistantId.value = id; assistantSheetOpen.value = false }

function normalizePromptPayload(payload) {
  if (typeof payload === 'string') return {text: payload.trim(), attachments: []}
  return { text: String(payload?.text || '').trim(), attachments: Array.isArray(payload?.attachments) ? payload.attachments : [] }
}

async function handleSubmit(payload) {
  const normalized = normalizePromptPayload(payload)
  if ((!normalized.text && normalized.attachments.length === 0) || isGenerating.value) return

  let targetHistoryId = Number(activeHistoryId.value)
  if (props.mode === 'main') {
    targetHistoryId = Date.now()
    histories.value.unshift({ id: targetHistoryId, title: normalized.text || '새 채팅', preview: normalized.text || '첨부 파일 기반 새 대화' })
    setConversation(targetHistoryId, [])
    await router.push({ name: 'chat', params: { id: targetHistoryId } })
    await nextTick()
  }

  const currentMessages = messages.value
  currentMessages.push({ id: createId('message'), role: 'user', content: normalized.text, attachments: normalized.attachments })
  const assistantMessage = { id: createId('message'), role: 'assistant', content: '' }
  currentMessages.push(assistantMessage)
  setConversation(targetHistoryId, currentMessages)
  markForceBottom(2500)
  await nextTick()
  await scrollBottom({force: true, stable: true})

  isGenerating.value = true
  const response = buildAssistantResponse(normalized)
  await streamText(response, (chunk) => { assistantMessage.content = chunk }, {delay: 9})
  isGenerating.value = false
  setConversation(targetHistoryId, currentMessages)
  markForceBottom(1000)
  await nextTick()
  await renderMermaidInElement(document.querySelector('.message-list'), {force: true})
  scrollBottom({force: true, stable: true})
}

function buildAssistantResponse({text, attachments}) {
  const fileSummary = attachments.length ? `\n\n첨부 파일 ${attachments.length}개를 함께 받았습니다. 이미지/파일 미리보기와 메시지 액션 영역도 유지됩니다.` : ''
  return `요청하신 내용을 Assistant 기준으로 정리해보겠습니다.\n\n- 입력: ${text || '첨부 기반 요청'}\n- 현재 화면은 메인/채팅방 라우트를 분리한 구조입니다.\n- 질문/답변 메시지는 개별 컴포넌트와 액션 컴포넌트로 분리되어 있습니다.\n- 스크롤이 하단이 아닐 때는 맨 아래 이동 버튼이 표시됩니다.${fileSummary}`
}

function getPreviewSources(detail = {}) { return [detail.dataUrl, detail.previewUrl, detail.url].filter((url) => typeof url === 'string' && url.length > 0).filter((url, index, array) => array.indexOf(url) === index) }
function readPreviewDataUrl(file) { return new Promise((resolve) => { if (!file || typeof FileReader === 'undefined') return resolve(''); const reader = new FileReader(); reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : ''); reader.onerror = () => resolve(''); reader.readAsDataURL(file) }) }
async function hydrateOpenPreviewFromFile(targetPreview) { const dataUrl = await readPreviewDataUrl(targetPreview?.file); if (!dataUrl || previewImage.value?.id !== targetPreview.id) return; previewImage.value = {...previewImage.value, dataUrl, url: dataUrl, sources: [dataUrl, ...(previewImage.value.sources || [])].filter((url, index, array) => url && array.indexOf(url) === index), loading: true, error: false} }
function openImagePreview(event) { const detail = event?.detail || {}; const sources = getPreviewSources(detail); const firstUrl = sources[0] || ''; previewImage.value = {...detail, url: firstUrl, sources, sourceIndex: 0, loading: Boolean(firstUrl || detail.file), error: !firstUrl && !detail.file}; if (detail.file && !detail.dataUrl) hydrateOpenPreviewFromFile({...detail, id: previewImage.value.id}) }
function handlePreviewLoad() { if (!previewImage.value) return; previewImage.value.loading = false; previewImage.value.error = false }
async function handlePreviewError() { const current = previewImage.value; if (!current) return; const nextIndex = Number(current.sourceIndex || 0) + 1; const nextUrl = current.sources?.[nextIndex]; if (nextUrl) { previewImage.value = {...current, url: nextUrl, sourceIndex: nextIndex, loading: true, error: false}; return } const dataUrl = await readPreviewDataUrl(current.file); if (dataUrl && previewImage.value?.id === current.id) { previewImage.value = {...previewImage.value, dataUrl, url: dataUrl, sources: [dataUrl], sourceIndex: 0, loading: true, error: false}; return } if (previewImage.value?.id === current.id) { previewImage.value.loading = false; previewImage.value.error = true } }
function closeImagePreview() { previewImage.value = null }

watch(() => route.params.id, loadRouteConversation, {immediate: true})

onMounted(() => {
  updateMobileState()
  removeMobileMediaQueryListener = addMediaQueryListener('(max-width: 900px)', updateMobileState)
  window.addEventListener('resize', updateMobileState, {passive: true})
  window.addEventListener('chat:image-preview', openImagePreview)
  window.addEventListener('scroll', scheduleBottomStateCheck, true)
})
onBeforeUnmount(() => {
  window.clearTimeout(bottomStateTimer)
  removeMobileMediaQueryListener?.()
  window.removeEventListener('resize', updateMobileState)
  window.removeEventListener('chat:image-preview', openImagePreview)
  window.removeEventListener('scroll', scheduleBottomStateCheck, true)
  revokeMessageAttachments(messages.value)
})
</script>
