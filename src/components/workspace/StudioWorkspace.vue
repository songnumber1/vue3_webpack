<template>
  <section class="studio-workspace" aria-label="Assistant Studio">
    <div class="studio-workspace__scroll">
      <div class="studio-hero">
        <div class="studio-hero__mark">AS</div>
        <h1>Assistant Studio</h1>
        <p>
          다양한 추가 지식과 기능을 활용한 맞춤형 Assistant를 탐색하고 직접 만들 수 있습니다.
        </p>
      </div>

      <div class="studio-toolbar">
        <label class="studio-search" for="studio-search-input">
          <span class="sr-only">Assistant Studio 검색</span>
          <input
            id="studio-search-input"
            v-model="searchText"
            type="search"
            placeholder="Assistant 검색"
            @keydown.enter.prevent="runSearch"
          />
        </label>
        <button
          class="studio-search-button"
          type="button"
          aria-label="검색"
          title="검색"
          @click="runSearch"
        >
          <span class="studio-icon studio-icon--search" aria-hidden="true"></span>
        </button>
      </div>

      <div class="studio-tabs-row">
        <div class="studio-tabs" role="tablist" aria-label="Assistant Studio 목록 유형">
          <button
            class="studio-tab"
            :class="{active: activeTab === 'all'}"
            type="button"
            @click="activeTab = 'all'"
          >
            Assistant 목록
          </button>
          <button
            class="studio-tab"
            :class="{active: activeTab === 'mine'}"
            type="button"
            @click="activeTab = 'mine'"
          >
            나의 Assistant
          </button>
        </div>
        <button class="studio-button studio-button--primary studio-create-entry" type="button" @click="openCreate">
          Assistant 만들기
        </button>
      </div>

      <div class="studio-list-area">
        <div class="studio-grid">
        <button
          v-for="studio in pagedStudios"
          :key="studio.id"
          class="studio-card"
          type="button"
          @click="selectedStudio = studio"
        >
          <span class="studio-card__image">{{ studio.initial }}</span>
          <span class="studio-card__body">
            <strong>{{ studio.name }}</strong>
            <small>{{ studio.category }} · {{ studio.model }}</small>
            <span>{{ studio.description }}</span>
          </span>
          <span class="studio-card__meta">좋아요 {{ studio.likes }} · 질문 {{ studio.views }}</span>
        </button>
        </div>
      </div>

      <nav class="studio-pagination" aria-label="Assistant Studio pagination">
        <button class="studio-page-icon-button" type="button" :disabled="currentPage === 1" aria-label="첫 페이지" @click="goPage(1)">
          <span class="studio-icon studio-icon--page-first" aria-hidden="true"></span>
        </button>
        <button class="studio-page-icon-button" type="button" :disabled="currentPage === 1" aria-label="이전 페이지" @click="goPage(currentPage - 1)">
          <span class="studio-icon studio-icon--page-prev" aria-hidden="true"></span>
        </button>
        <button
          v-for="page in paginationPages"
          :key="page.key"
          type="button"
          :disabled="page.ellipsis"
          :class="{active: page.value === currentPage, 'studio-pagination__ellipsis': page.ellipsis}"
          @click="!page.ellipsis && goPage(page.value)"
        >
          {{ page.label }}
        </button>
        <button class="studio-page-icon-button" type="button" :disabled="currentPage === maxPage" aria-label="다음 페이지" @click="goPage(currentPage + 1)">
          <span class="studio-icon studio-icon--page-next" aria-hidden="true"></span>
        </button>
        <button class="studio-page-icon-button" type="button" :disabled="currentPage === maxPage" aria-label="마지막 페이지" @click="goPage(maxPage)">
          <span class="studio-icon studio-icon--page-last" aria-hidden="true"></span>
        </button>
      </nav>
    </div>

    <div v-if="selectedStudio" class="studio-dialog-backdrop" @click.self="selectedStudio = null">
      <article class="studio-dialog" role="dialog" aria-modal="true">
        <button class="studio-dialog__close" type="button" @click="selectedStudio = null">×</button>
        <div class="studio-dialog__head">
          <div class="studio-dialog__image">{{ selectedStudio.initial }}</div>
          <div>
            <h2>{{ selectedStudio.name }}</h2>
            <p>좋아요 {{ selectedStudio.likes }} · 질문 {{ selectedStudio.views }} · {{ selectedStudio.owner }} · {{ selectedStudio.model }}</p>
          </div>
        </div>
        <p class="studio-dialog__desc">{{ selectedStudio.description }}</p>
        <h3>프롬프트 예시</h3>
        <div class="studio-prompt-grid">
          <button v-for="prompt in selectedStudio.prompts" :key="prompt" type="button">{{ prompt }}</button>
        </div>
        <h3>학습 사내 지식</h3>
        <p class="studio-dialog__box">{{ selectedStudio.knowledge }}</p>
        <h3>공개 범위</h3>
        <p class="studio-dialog__box">{{ selectedStudio.scope }}</p>
      </article>
    </div>

    <div v-if="createOpen" class="studio-create-panel">
      <div class="studio-create-panel__head">
        <strong>Assistant 만들기</strong>
        <div>
          <button class="studio-button" type="button" @click="applyPreview">적용</button>
          <button class="studio-button" type="button">저장</button>
          <button class="studio-button studio-button--primary" type="button">등록</button>
          <button class="studio-button" type="button" @click="createOpen = false">닫기</button>
        </div>
      </div>
      <div class="studio-create-layout">
        <form class="studio-create-form" @submit.prevent>
          <div class="studio-create-tabs">
            <button type="button" :class="{active: createTab === 'basic'}" @click="createTab = 'basic'">기본 정보</button>
            <button type="button" :class="{active: createTab === 'feature'}" @click="createTab = 'feature'">주요 기능</button>
            <button type="button" :class="{active: createTab === 'share'}" @click="createTab = 'share'">공유범위</button>
          </div>

          <div v-if="createTab === 'basic'" class="studio-form-stack">
            <label>대표이미지<input v-model="draft.image" placeholder="이미지 파일명" /></label>
            <label>카테고리<select v-model="draft.category"><option>마케팅</option><option>개발</option><option>공통/기타</option></select></label>
            <label>Assistant 이름<input v-model="draft.name" placeholder="Assistant 이름" /></label>
            <label>Instruction<textarea v-model="draft.instruction" rows="4" /></label>
            <label>설명<textarea v-model="draft.description" rows="3" /></label>
            <label v-for="index in 8" :key="index">예시 프롬프트 {{ index }}<input v-model="draft.prompts[index - 1]" /></label>
          </div>

          <div v-else-if="createTab === 'feature'" class="studio-form-stack">
            <fieldset>
              <legend>모델 선택</legend>
              <label v-for="model in modelOptions" :key="model"><input v-model="draft.models" type="checkbox" :value="model" />{{ model }}</label>
            </fieldset>
            <StudioMultiSelect v-model="draft.rags" title="RAG 데이터 선택" :options="ragOptions" />
            <StudioMultiSelect v-model="draft.mcps" title="MCP 플러그인 선택" :options="mcpOptions" />
          </div>

          <div v-else class="studio-form-stack">
            <fieldset>
              <legend>공개 대상</legend>
              <label><input v-model="draft.scope" type="radio" value="public" />공개</label>
              <label><input v-model="draft.scope" type="radio" value="private" />비공개</label>
            </fieldset>
            <div class="studio-authority-actions">
              <button class="studio-button" type="button">추가</button>
              <button class="studio-button" type="button">삭제</button>
            </div>
            <div class="studio-authority-grid">
              <div>권한명</div><div>설명</div>
              <div>auth1 권한</div><div>auth1 권한 설명</div>
            </div>
          </div>
        </form>

        <aside class="studio-preview" aria-label="Assistant 미리보기">
          <div class="studio-preview__logo">{{ previewInitial }}</div>
          <h2>{{ preview.name || 'Assistant 이름' }}</h2>
          <p>{{ preview.description || '설명을 입력하고 적용을 누르면 미리보기에 표시됩니다.' }}</p>
          <div class="studio-prompt-grid studio-prompt-grid--preview">
            <button v-for="prompt in previewPrompts" :key="prompt" type="button">{{ prompt }}</button>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup>
/**
 * @file components/workspace/StudioWorkspace.vue
 * @description 공통 AppShell 내부에 라우터로 마운트되는 Assistant Studio workspace입니다.
 */
import {computed, reactive, ref, watch} from "vue";
import StudioMultiSelect from "@/views/studio/StudioMultiSelect.vue";

const searchText = ref("");
const activeTab = ref("all");
const currentPage = ref(1);
const pageSize = 6;
const submittedSearchText = ref("");
const createOpen = ref(false);
const createTab = ref("basic");
const selectedStudio = ref(null);

const studios = ref([
  {id: "s1", initial: "M", name: "마케팅 캠페인 Assistant", category: "마케팅", model: "GPT-OSS", description: "캠페인 기획과 문구 작성을 지원합니다.", likes: 24, views: 582, owner: "테스터1", knowledge: "마케팅 정책, 캠페인 가이드", scope: "전체 공개", prompts: ["신제품 캠페인 기획", "SNS 문구 작성", "타깃 분석", "성과 리포트 요약"]},
  {id: "s2", initial: "D", name: "개발 문서 Assistant", category: "개발", model: "Gemma 3", description: "개발 표준과 API 문서 탐색을 지원합니다.", likes: 18, views: 311, owner: "테스터2", knowledge: "Confluence, Jira", scope: "개발 조직", prompts: ["API 요약", "장애 원인 정리", "PR 설명 작성", "릴리즈 노트"]},
  {id: "s3", initial: "Q", name: "품질 점검 Assistant", category: "품질", model: "GPT-OSS", description: "품질 기준과 체크리스트를 기반으로 점검합니다.", likes: 11, views: 214, owner: "테스터3", knowledge: "품질 매뉴얼", scope: "전체 공개", prompts: ["점검표 생성", "리스크 정리", "불량 유형 분석", "보고서 작성"]},
]);

const draft = reactive({
  image: "",
  category: "마케팅",
  name: "",
  instruction: "",
  description: "",
  prompts: Array.from({length: 8}, () => ""),
  models: [],
  rags: [],
  mcps: [],
  scope: "private",
});
const preview = reactive({name: "", description: "", prompts: []});
const modelOptions = ["GPT-OSS", "Gemma 3", "Claude", "Internal Reasoning"];
const ragOptions = ["논문", "Confluence", "Jira", "사내 규정", "기술 문서"];
const mcpOptions = ["메일", "캘린더", "파일 검색", "GitHub", "배포 조회"];

const filteredStudios = computed(() => {
  const keyword = submittedSearchText.value.trim().toLowerCase();
  return studios.value.filter((studio) => {
    const matchedTab = activeTab.value === "all" || studio.owner === "테스터1";
    const matchedKeyword = !keyword || `${studio.name} ${studio.description} ${studio.category}`.toLowerCase().includes(keyword);
    return matchedTab && matchedKeyword;
  });
});
const maxPage = computed(() => Math.max(1, Math.ceil(filteredStudios.value.length / pageSize)));
const pagedStudios = computed(() => filteredStudios.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize));
const paginationPages = computed(() => {
  const last = maxPage.value;
  const pages = [{key: "p1", value: 1, label: "1"}];
  if (last > 1) {
    if (last > 10) pages.push({key: "dots", label: "...", ellipsis: true});
    pages.push({key: `p${Math.min(10, last)}`, value: Math.min(10, last), label: String(Math.min(10, last))});
  }
  return pages;
});
const previewInitial = computed(() => (preview.name || "A").slice(0, 1).toUpperCase());
const previewPrompts = computed(() => preview.prompts.filter(Boolean).slice(0, 4));

watch(activeTab, () => {
  currentPage.value = 1;
});

function runSearch() {
  submittedSearchText.value = searchText.value;
  currentPage.value = 1;
}
function goPage(page) {
  currentPage.value = Math.min(maxPage.value, Math.max(1, page));
}
function openCreate() {
  createOpen.value = true;
}
function applyPreview() {
  preview.name = draft.name;
  preview.description = draft.description;
  preview.prompts = [...draft.prompts];
}
</script>
