<template>
  <section class="chat-search-workspace" :aria-label="t('chatSearch.title')">
    <ChatHeader
      v-if="isMobile"
      mode="main"
      :assistant-label="workspaceState.assistantLabel"
      :assistant="workspaceState.assistant"
      :conversation-title="t('chatSearch.title')"
      :theme-name="workspaceState.themeName"
    />

    <div class="chat-search-scroll">
      <div class="chat-search-panel">
        <header class="chat-search-page-head">
          <div class="chat-search-page-head__text">
            <span>{{ t("chatSearch.eyebrow") }}</span>
            <h1>{{ t("chatSearch.title") }}</h1>
          </div>
        </header>

        <form
          class="chat-search-form"
          role="search"
          @submit.prevent="runSearch({resetPage: true})"
        >
          <label class="sr-only" for="chat-search-keyword">{{
            t("chatSearch.inputLabel")
          }}</label>
          <input
            id="chat-search-keyword"
            v-model="keyword"
            type="search"
            autocomplete="off"
            :placeholder="t('chatSearch.placeholder')"
            @input="handleKeywordInput"
          />
          <button type="submit" :aria-label="t('chatSearch.searchAction')">
            <span
              class="studio-icon studio-icon--search"
              aria-hidden="true"
            ></span>
          </button>
        </form>

        <div class="chat-search-list-shell">
          <div class="chat-search-list-head" aria-live="polite">
            <strong>{{ listTitle }}</strong>
            <span>{{ summaryText }}</span>
          </div>

          <div ref="listAreaRef" class="chat-search-list-area">
            <div v-if="loading" class="chat-search-state">
              <span class="chat-search-loading-dot" aria-hidden="true"></span>
              <p>{{ t("chatSearch.loading") }}</p>
            </div>

            <div v-else-if="!pagedResults.length" class="chat-search-empty">
              <span
                class="studio-icon studio-icon--search"
                aria-hidden="true"
              ></span>
              <strong>{{ t("chatSearch.emptyTitle") }}</strong>
              <p>{{ t("chatSearch.emptyDescription") }}</p>
            </div>

            <ul v-else class="chat-search-results">
              <li
                v-for="result in pagedResults"
                :key="result.chatId || result.id"
              >
                <button
                  type="button"
                  class="chat-search-result"
                  @click="openChat(result)"
                >
                  <span class="chat-search-result__body">
                    <span class="chat-search-result__title">{{
                      result.title || result.chatTitle
                    }}</span>
                    <span
                      v-if="isSearchMode"
                      class="chat-search-result__snippet"
                    >
                      {{ result.snippet || result.preview }}
                    </span>
                  </span>
                  <span class="chat-search-result__date">
                    {{ formatListDate(result.chatEndDt || result.endedAt) }}
                  </span>
                </button>
              </li>
            </ul>
          </div>

          <nav
            class="chat-search-pagination"
            :aria-label="t('chatSearch.pagination')"
          >
            <button
              type="button"
              :disabled="currentPage <= 1"
              @click="goToPage(currentPage - 1)"
            >
              <span
                class="studio-icon studio-icon--page-prev"
                aria-hidden="true"
              ></span>
            </button>
            <button
              v-for="page in visiblePages"
              :key="page"
              type="button"
              :class="{active: page === currentPage}"
              :aria-current="page === currentPage ? 'page' : undefined"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <button
              type="button"
              :disabled="currentPage >= totalPages"
              @click="goToPage(currentPage + 1)"
            >
              <span
                class="studio-icon studio-icon--page-next"
                aria-hidden="true"
              ></span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
/**
 * @file components/search/ChatSearchWorkspace.vue
 * @description Studio 목록 레이아웃 리듬을 사용하는 채팅 검색 화면입니다.
 */
import {computed, onBeforeUnmount, onMounted, ref, watch, inject} from "vue";
import {useRouter} from "vue-router";
import {useChatStore} from "@/stores/chatStore";
import {openChatRoom, clearPendingChatRoom} from "@/composables/chat/chatRoomActions";
import {useI18n} from "vue-i18n";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import {useResponsiveLayoutStore} from "@/stores/responsiveLayoutStore";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import {resolveChatApis} from "@/api/runtime/chatApis";
import {
  adaptChatSearchResponse,
  createHistoryFromSearchResult,
} from "@/adapters/chatResponseAdapter";
import {
  createEmptyWorkspaceState,
  CHAT_WORKSPACE_STATE_KEY,
} from "@/composables/chat/chatStateContext";

const {t, locale} = useI18n();
const {shouldUseOverlayScrollbar} = useOverlayScrollPolicy();
const router = useRouter();
const chatStore = useChatStore();
const responsiveLayoutStore = useResponsiveLayoutStore();
const isMobile = computed(() => responsiveLayoutStore.isMobile);
const injectedWorkspaceState = inject(
  CHAT_WORKSPACE_STATE_KEY,
  computed(createEmptyWorkspaceState)
);
const workspaceState = computed(
  () => injectedWorkspaceState.value || createEmptyWorkspaceState()
);

const keyword = ref("");
const lastSearchedKeyword = ref("");
const allResults = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const debounceTimer = ref(null);
const listAreaRef = ref(null);

const pageSize = computed(() => (isMobile.value ? 10 : 12));
const totalPages = computed(() =>
  Math.max(1, Math.ceil(allResults.value.length / pageSize.value))
);
const isSearchMode = computed(() => Boolean(lastSearchedKeyword.value));
const pagedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return allResults.value.slice(start, start + pageSize.value);
});
const visiblePages = computed(() =>
  createVisiblePages(currentPage.value, totalPages.value)
);
const listTitle = computed(() =>
  isSearchMode.value
    ? t("chatSearch.resultsTitle")
    : t("chatSearch.recentTitle")
);
useOverlayScrollbar(
  listAreaRef,
  {overflow: {x: "hidden", y: "scroll"}},
  {
    enabled: () => shouldUseOverlayScrollbar.value,
    watchSource: () => [
      pagedResults.value.length,
      loading.value,
      currentPage.value,
    ],
  }
);

const summaryText = computed(() => {
  if (loading.value) return t("chatSearch.searching");
  if (isSearchMode.value) {
    return t("chatSearch.searchResultSummary", {
      count: allResults.value.length,
      keyword: lastSearchedKeyword.value,
    });
  }
  return t("chatSearch.recentSummary", {count: allResults.value.length});
});

watch(totalPages, (nextTotal) => {
  if (currentPage.value > nextTotal) currentPage.value = nextTotal;
});

onMounted(() => {
  runSearch({resetPage: true});
});

onBeforeUnmount(() => {
  if (debounceTimer.value) window.clearTimeout(debounceTimer.value);
});

function handleKeywordInput() {
  if (debounceTimer.value) window.clearTimeout(debounceTimer.value);
  debounceTimer.value = window.setTimeout(() => {
    runSearch({resetPage: true});
  }, 220);
}

async function runSearch({resetPage = false} = {}) {
  const nextKeyword = keyword.value.trim();
  lastSearchedKeyword.value = nextKeyword;
  if (resetPage) currentPage.value = 1;
  loading.value = true;

  try {
    const {chatHistoryApi} = resolveChatApis();
    const response = await chatHistoryApi.searchChats({
      keyword: nextKeyword,
      searchText: nextKeyword,
      query: nextKeyword,
      limit: 200,
    });
    allResults.value = adaptChatSearchResponse(response, {
      fallbackTitle: t("chatSearch.untitled"),
      keyword: nextKeyword,
    }).list;
  } catch (_error) {
    allResults.value = [];
  } finally {
    loading.value = false;
  }
}

function goToPage(page) {
  const nextPage = Math.min(Math.max(Number(page) || 1, 1), totalPages.value);
  currentPage.value = nextPage;
}

function createVisiblePages(current, total) {
  const maxCount = isMobile.value ? 3 : 5;
  const half = Math.floor(maxCount / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + maxCount - 1);
  start = Math.max(1, end - maxCount + 1);
  return Array.from({length: end - start + 1}, (_, index) => start + index);
}

async function openChat(result) {
  const chatId = String(result?.chatId || result?.id || "").trim();
  if (!chatId) return;

  ensureSearchResultHistory(result, chatId);

  const messageId = String(
    result?.messageId || result?.targetMessageId || ""
  ).trim();
  const query = isSearchMode.value && messageId ? {messageId} : undefined;

  try {
    const opened = await openChatRoom(router, chatId);
    if (!opened) return;

    if (query) {
      await router.replace({query}).catch(() => {});
    }
  } catch (_error) {
    clearPendingChatRoom(chatId);
  }
}

function ensureSearchResultHistory(result = {}, chatId = "") {
  if (!chatId || chatStore.getHistory(chatId)) return;

  chatStore.addHistory(
    createHistoryFromSearchResult(
      {...result, chatId},
      {fallbackTitle: t("chatSearch.untitled")}
    )
  );
}

function formatListDate(value) {
  if (!value) return t("chatSearch.noDate");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("chatSearch.noDate");
  return new Intl.DateTimeFormat(locale.value === "en" ? "en" : "ko-KR", {
    month: "short",
    day: "numeric",
  }).format(date);
}
</script>
