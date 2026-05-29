<template>
  <section class="studio-workspace" aria-label="Assistant Studio">
    <ChatHeader
      v-if="isMobile"
      mode="studio"
      :is-mobile="isMobile"
      :assistant-label="assistantLabel"
      :assistant="assistant"
      conversation-title="Assistant Studio"
      :theme-name="themeName"
    />

    <template v-if="createOpen">
      <section class="studio-create-page" aria-label="Assistant 만들기">
        <header class="studio-create-panel__head">
          <button
            v-if="isMobile"
            class="studio-create-panel__back"
            type="button"
            aria-label="뒤로"
            @click="closeCreate"
          >
            ‹
          </button>
          <strong>Assistant 만들기</strong>
          <div class="studio-create-actions">
            <button class="studio-button" type="button" @click="applyPreview">
              적용
            </button>
            <button class="studio-button" type="button">저장</button>
            <button class="studio-button studio-button--primary" type="button">
              등록
            </button>
            <button class="studio-button" type="button" @click="closeCreate">
              닫기
            </button>
          </div>
        </header>

        <div class="studio-create-layout">
          <form class="studio-create-form" @submit.prevent>
            <div
              class="studio-create-tabs"
              role="tablist"
              aria-label="Assistant 만들기 설정"
            >
              <button
                type="button"
                :class="{active: createTab === 'basic'}"
                @click="createTab = 'basic'"
              >
                기본 정보
              </button>
              <button
                type="button"
                :class="{active: createTab === 'feature'}"
                @click="createTab = 'feature'"
              >
                주요 기능
              </button>
              <button
                type="button"
                :class="{active: createTab === 'share'}"
                @click="createTab = 'share'"
              >
                공유범위
              </button>
            </div>

            <div v-if="createTab === 'basic'" class="studio-form-stack">
              <label
                >대표이미지<input
                  v-model="draft.image"
                  placeholder="이미지 URL 또는 업로드 경로"
              /></label>
              <label class="studio-category-field">
                카테고리
                <button
                  class="studio-select-like"
                  type="button"
                  @click="openCategorySelector"
                >
                  <span>{{ selectedCategoryLabel }}</span>
                  <span aria-hidden="true">⌄</span>
                </button>
              </label>
              <label
                >Assistant 이름<input
                  v-model="draft.name"
                  placeholder="Assistant 이름"
              /></label>
              <label
                >Instruction<textarea
                  v-model="draft.instruction"
                  rows="5"
                  placeholder="Assistant가 따라야 할 지시사항"
                />
              </label>
              <label
                >설명<textarea
                  v-model="draft.description"
                  rows="4"
                  placeholder="사용자에게 보여줄 설명"
                />
              </label>
              <label v-for="index in 8" :key="index"
                >예시 프롬프트 {{ index
                }}<input
                  v-model="draft.prompts[index - 1]"
                  :placeholder="`예시 프롬프트 ${index}`"
              /></label>
            </div>

            <div v-else-if="createTab === 'feature'" class="studio-form-stack">
              <fieldset class="studio-model-fieldset">
                <legend>모델 선택</legend>
                <label
                  v-for="model in modelOptions"
                  :key="model.value"
                  class="studio-check-row"
                >
                  <input
                    v-model="draft.models"
                    type="checkbox"
                    :value="model.value"
                  />
                  <span>
                    <strong>{{ model.label }}</strong>
                    <small>{{ model.description }}</small>
                  </span>
                </label>
              </fieldset>
              <StudioMultiSelect
                v-model="draft.rags"
                title="RAG 데이터 선택"
                :options="ragOptions"
              />
              <StudioMultiSelect
                v-model="draft.mcps"
                title="MCP 플러그인 선택"
                :options="mcpOptions"
              />
            </div>

            <div v-else class="studio-form-stack">
              <fieldset class="studio-scope-fieldset">
                <legend>공개 대상</legend>
                <label class="studio-radio-card"
                  ><input
                    v-model="draft.scope"
                    type="radio"
                    value="public"
                  /><span
                    ><strong>공개</strong
                    ><small
                      >전체 또는 선택한 권한 사용자가 사용할 수 있습니다.</small
                    ></span
                  ></label
                >
                <label class="studio-radio-card"
                  ><input
                    v-model="draft.scope"
                    type="radio"
                    value="private"
                  /><span
                    ><strong>비공개</strong
                    ><small>지정한 사용자만 사용할 수 있습니다.</small></span
                  ></label
                >
              </fieldset>
              <div class="studio-authority-actions">
                <button
                  class="studio-button studio-button--primary-ghost"
                  type="button"
                  @click="authorityPickerOpen = true"
                >
                  + 추가
                </button>
                <button
                  class="studio-button studio-button--danger-ghost"
                  type="button"
                  @click="deleteCheckedAuthorities"
                >
                  삭제
                </button>
              </div>
              <div
                class="studio-authority-grid"
                role="table"
                aria-label="공유 권한 목록"
              >
                <div class="studio-authority-grid__head" role="row">
                  <div role="columnheader">
                    <input
                      type="checkbox"
                      :checked="allAuthoritiesChecked"
                      @change="toggleAllAuthorities"
                    />
                  </div>
                  <div role="columnheader">권한명</div>
                  <div role="columnheader">설명</div>
                </div>
                <div
                  v-for="auth in selectedAuthorities"
                  :key="auth.deptId"
                  class="studio-authority-grid__row"
                  role="row"
                >
                  <div role="cell">
                    <input v-model="auth.checked" type="checkbox" />
                  </div>
                  <div role="cell">{{ auth.deptNameKo }}</div>
                  <div role="cell">{{ auth.description }}</div>
                </div>
                <div
                  v-if="!selectedAuthorities.length"
                  class="studio-authority-grid__empty"
                >
                  추가된 공개 대상이 없습니다.
                </div>
              </div>
            </div>
          </form>

          <aside class="studio-preview" aria-label="Assistant 미리보기">
            <div class="studio-preview__label">미리보기</div>
            <div class="studio-preview__card">
              <div class="studio-preview__logo">{{ previewInitial }}</div>
              <h2>{{ preview.name || "Assistant 이름" }}</h2>
              <p>
                {{
                  preview.description ||
                  "설명을 입력하고 적용을 누르면 미리보기에 표시됩니다."
                }}
              </p>
              <div class="studio-prompt-grid studio-prompt-grid--preview">
                <button
                  v-for="prompt in previewPrompts"
                  :key="prompt"
                  type="button"
                >
                  {{ prompt }}<span aria-hidden="true">›</span>
                </button>
              </div>
              <small>미리보기는 실제 Assistant와 다를 수 있습니다.</small>
            </div>
          </aside>
        </div>
      </section>
    </template>

    <template v-else-if="mobileDetailStudio">
      <article class="studio-mobile-page" aria-label="Assistant Studio 상세">
        <header class="studio-mobile-page__head">
          <button
            type="button"
            aria-label="뒤로"
            @click="mobileDetailStudio = null"
          >
            ‹
          </button>
          <strong>{{ mobileDetailStudio.name }}</strong>
        </header>
        <StudioDetailContent :studio="mobileDetailStudio" />
      </article>
    </template>

    <template v-else>
      <div class="studio-workspace__scroll">
        <div class="studio-hero">
          <div class="studio-hero__mark">AS</div>
          <h1>Assistant Studio</h1>
          <p>
            다양한 추가 지식과 기능을 활용한 맞춤형 Assistant를 탐색하고 직접
            만들 수 있습니다.
          </p>
        </div>

        <div class="studio-toolbar">
          <div class="studio-search">
            <label class="sr-only" for="studio-search-input"
              >Assistant Studio 검색</label
            >
            <input
              id="studio-search-input"
              v-model="searchText"
              type="search"
              placeholder="Assistant 검색"
              @keydown.enter.prevent="runSearch"
            />
            <button
              class="studio-search-button"
              type="button"
              aria-label="검색"
              title="검색"
              @click="runSearch"
            >
              <span
                class="studio-icon studio-icon--search"
                aria-hidden="true"
              ></span>
            </button>
          </div>
        </div>

        <div class="studio-tabs-row">
          <div
            class="studio-tabs"
            role="tablist"
            aria-label="Assistant Studio 목록 유형"
          >
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
          <button
            class="studio-button studio-button--primary studio-create-entry"
            type="button"
            @click="openCreate"
          >
            Assistant 만들기
          </button>
        </div>

        <div
          v-if="activeTab === 'all'"
          class="studio-category-chips"
          aria-label="Assistant Studio 카테고리"
        >
          <button
            v-for="category in studioCategoryChips"
            :key="category.value"
            type="button"
            :class="{active: activeCategory === category.value}"
            @click="selectListCategory(category.value)"
          >
            {{ category.label }}
          </button>
        </div>

        <div class="studio-list-shell">
          <div class="studio-list-area">
            <div class="studio-grid">
              <button
                v-for="studio in pagedStudios"
                :key="studio.id"
                class="studio-card"
                type="button"
                @click="openDetail(studio)"
              >
                <span class="studio-card__image">{{ studio.initial }}</span>
                <span class="studio-card__more" aria-hidden="true">•••</span>
                <span class="studio-card__body">
                  <strong>{{ studio.name }}</strong>
                  <small>{{ studio.category }} · {{ studio.model }}</small>
                  <span>{{ studio.description }}</span>
                </span>
                <span class="studio-card__meta"
                  >좋아요 {{ studio.likes }} · 질문 {{ studio.views }}</span
                >
              </button>
            </div>
          </div>

          <nav
            class="studio-pagination"
            aria-label="Assistant Studio pagination"
          >
            <button
              class="studio-page-icon-button"
              type="button"
              :disabled="currentPage === 1"
              aria-label="첫 페이지"
              @click="goPage(1)"
            >
              <span
                class="studio-icon studio-icon--page-first"
                aria-hidden="true"
              ></span>
            </button>
            <button
              class="studio-page-icon-button"
              type="button"
              :disabled="currentPage === 1"
              aria-label="이전 페이지"
              @click="goPage(currentPage - 1)"
            >
              <span
                class="studio-icon studio-icon--page-prev"
                aria-hidden="true"
              ></span>
            </button>
            <button
              v-for="page in paginationPages"
              :key="page.key"
              type="button"
              :disabled="page.ellipsis"
              :class="{
                active: page.value === currentPage,
                'studio-pagination__ellipsis': page.ellipsis,
              }"
              @click="!page.ellipsis && goPage(page.value)"
            >
              {{ page.label }}
            </button>
            <button
              class="studio-page-icon-button"
              type="button"
              :disabled="currentPage === maxPage"
              aria-label="다음 페이지"
              @click="goPage(currentPage + 1)"
            >
              <span
                class="studio-icon studio-icon--page-next"
                aria-hidden="true"
              ></span>
            </button>
            <button
              class="studio-page-icon-button"
              type="button"
              :disabled="currentPage === maxPage"
              aria-label="마지막 페이지"
              @click="goPage(maxPage)"
            >
              <span
                class="studio-icon studio-icon--page-last"
                aria-hidden="true"
              ></span>
            </button>
          </nav>
        </div>
      </div>
    </template>

    <div
      v-if="selectedStudio && !isMobile"
      class="studio-dialog-backdrop"
      @click.self="selectedStudio = null"
    >
      <article
        class="studio-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Assistant Studio 상세"
      >
        <button
          class="studio-dialog__close"
          type="button"
          aria-label="닫기"
          @click="selectedStudio = null"
        >
          ×
        </button>
        <StudioDetailContent :studio="selectedStudio" />
      </article>
    </div>

    <div
      v-if="categorySelectorOpen"
      class="studio-picker-backdrop"
      @click.self="categorySelectorOpen = false"
    >
      <section
        class="studio-picker"
        role="dialog"
        aria-modal="true"
        aria-label="카테고리 선택"
      >
        <header class="studio-picker__head">
          <strong>카테고리 선택</strong
          ><button type="button" @click="categorySelectorOpen = false">
            ×
          </button>
        </header>
        <button
          v-for="category in categoryOptions"
          :key="category.value"
          class="studio-picker__option"
          :class="{active: draft.category === category.value}"
          type="button"
          @click="selectCategory(category.value)"
        >
          <span>{{ category.label }}</span>
          <small>{{ category.description }}</small>
        </button>
      </section>
    </div>

    <div
      v-if="authorityPickerOpen"
      class="studio-picker-backdrop"
      @click.self="authorityPickerOpen = false"
    >
      <section
        class="studio-picker studio-picker--authority"
        role="dialog"
        aria-modal="true"
        aria-label="공개 대상 추가"
      >
        <header class="studio-picker__head">
          <strong>공개 대상 추가</strong
          ><button type="button" @click="authorityPickerOpen = false">×</button>
        </header>
        <div class="studio-picker__list">
          <button
            v-for="auth in availableAuthorities"
            :key="auth.deptId"
            class="studio-picker__option"
            type="button"
            @click="addAuthority(auth)"
          >
            <span>{{ auth.deptNameKo }}</span>
            <small>{{ auth.description }}</small>
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup>
/**
 * @file components/workspace/StudioWorkspace.vue
 * @description 공통 AppShell 내부에 라우터로 마운트되는 Assistant Studio workspace입니다.
 */
import {
  computed,
  defineComponent,
  h,
  inject,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import StudioMultiSelect from "@/views/studio/StudioMultiSelect.vue";
import {httpClient, unwrapResponseData} from "@/api/clients/httpClient";
import {
  CHAT_WORKSPACE_STATE_KEY,
  createEmptyWorkspaceState,
} from "@/composables/chat/chatActionContext";

const StudioDetailContent = defineComponent({
  name: "StudioDetailContent",
  props: {studio: {type: Object, required: true}},
  setup(props) {
    return () =>
      h("div", {class: "studio-detail-content"}, [
        h("div", {class: "studio-dialog__head"}, [
          h("div", {class: "studio-dialog__image"}, props.studio.initial),
          h("div", [
            h("h2", props.studio.name),
            h(
              "p",
              `좋아요 ${props.studio.likes} · 질문 ${props.studio.views} · ${props.studio.owner} · ${props.studio.model}`
            ),
          ]),
        ]),
        h("p", {class: "studio-dialog__desc"}, props.studio.description),
        h("h3", "프롬프트 예시"),
        h(
          "div",
          {class: "studio-prompt-grid"},
          props.studio.prompts.map((prompt) =>
            h("button", {type: "button", key: prompt}, prompt)
          )
        ),
        h("h3", "학습 사내 지식"),
        h("p", {class: "studio-dialog__box"}, props.studio.knowledge),
        h("h3", "공개 범위"),
        h("p", {class: "studio-dialog__box"}, props.studio.scope),
      ]);
  },
});

const searchText = ref("");
const activeTab = ref("all");
const activeCategory = ref("ALL");
const currentPage = ref(1);
const pageSize = 6;
const submittedSearchText = ref("");
const createOpen = ref(false);
const createTab = ref("basic");
const selectedStudio = ref(null);
const mobileDetailStudio = ref(null);
const categorySelectorOpen = ref(false);
const authorityPickerOpen = ref(false);

const workspaceState = inject(
  CHAT_WORKSPACE_STATE_KEY,
  computed(createEmptyWorkspaceState)
);
const isMobile = computed(() => workspaceState.value.isMobile);
const assistantLabel = computed(() => workspaceState.value.assistantLabel);
const assistant = computed(() => workspaceState.value.assistant);
const themeName = computed(() => workspaceState.value.themeName);

const studioCategoryOptions = ref([
  {value: "ALL", label: "전체", description: "전체"},
  {value: "MKT", label: "마케팅", description: "마케팅 설명"},
  {value: "SALES", label: "판매", description: "판매 설명"},
  {value: "DEV", label: "개발", description: "개발 설명"},
  {value: "MFG", label: "제조", description: "제조 설명"},
  {value: "QA", label: "품질", description: "품질 설명"},
  {value: "MGMT", label: "경영관리", description: "경영관리 설명"},
  {value: "PUR", label: "구매", description: "구매 설명"},
  {value: "LOG", label: "물류", description: "물류 설명"},
  {
    value: "INFRA",
    label: "인프라/환경안정",
    description: "인프라/환경안정 설명",
  },
  {value: "COMMON", label: "공통/기타", description: "공통 설명"},
]);
const categoryOptions = ref(
  studioCategoryOptions.value.filter((item) => item.value !== "ALL")
);
const modelOptions = ref([
  {value: "gpt-oss", label: "GPT-OSS", description: "빠른 추론 결과 도출 가능"},
  {
    value: "gemma-3",
    label: "Gemma 3",
    description: "문서 기반 요약과 분석에 적합",
  },
  {value: "claude", label: "Claude", description: "긴 문맥 분석에 적합"},
  {
    value: "internal-reasoning",
    label: "Internal Reasoning",
    description: "사내 추론 워크로드용",
  },
]);
const ragOptions = ref([
  "논문",
  "Confluence",
  "Jira",
  "사내 규정",
  "기술 문서",
]);
const mcpOptions = ref(["메일", "캘린더", "파일 검색", "GitHub", "배포 조회"]);
const authorityOptions = ref([
  {
    checked: false,
    deptId: "auth1",
    deptCode: "auth1",
    deptNameKo: "auth1 권한",
    description: "auth1 권한 설명",
  },
]);
const selectedAuthorities = ref([
  {
    checked: false,
    deptId: "auth1",
    deptCode: "auth1",
    deptNameKo: "auth1 권한",
    description: "auth1 권한 설명",
  },
]);

const studios = ref([
  {
    id: "s1",
    initial: "마",
    name: "마케팅 캠페인 Assistant",
    categoryCode: "MKT",
    category: "마케팅",
    model: "GPT-OSS",
    description: "캠페인 기획과 문구 작성을 지원합니다.",
    likes: 24,
    views: 582,
    owner: "테스터1",
    knowledge: "마케팅 정책, 캠페인 가이드",
    scope: "전체 공개",
    prompts: [
      "신제품 캠페인 기획",
      "SNS 문구 작성",
      "타깃 분석",
      "성과 리포트 요약",
    ],
  },
  {
    id: "s2",
    initial: "개",
    name: "개발 문서 Assistant",
    categoryCode: "DEV",
    category: "개발",
    model: "Gemma 3",
    description: "개발 표준과 API 문서 탐색을 지원합니다.",
    likes: 18,
    views: 311,
    owner: "테스터2",
    knowledge: "Confluence, Jira",
    scope: "개발 조직",
    prompts: ["API 요약", "장애 원인 정리", "PR 설명 작성", "릴리즈 노트"],
  },
  {
    id: "s3",
    initial: "품",
    name: "품질 점검 Assistant",
    categoryCode: "QA",
    category: "품질",
    model: "GPT-OSS",
    description: "품질 기준과 체크리스트를 기반으로 점검합니다.",
    likes: 11,
    views: 214,
    owner: "테스터3",
    knowledge: "품질 매뉴얼",
    scope: "전체 공개",
    prompts: ["점검표 생성", "리스크 정리", "불량 유형 분석", "보고서 작성"],
  },
  {
    id: "s4",
    initial: "경",
    name: "경영 KPI Assistant",
    categoryCode: "MGMT",
    category: "경영관리",
    model: "Claude",
    description: "경영 KPI 분석과 리포트 작성을 지원합니다.",
    likes: 15,
    views: 267,
    owner: "테스터1",
    knowledge: "경영 리포트",
    scope: "전체 공개",
    prompts: [
      "월간 KPI 요약",
      "실적 차이 분석",
      "임원 보고서 초안",
      "리스크 정리",
    ],
  },
  {
    id: "s5",
    initial: "구",
    name: "구매 견적 Assistant",
    categoryCode: "PUR",
    category: "구매",
    model: "GPT-OSS",
    description: "견적 비교 및 공급사 분석을 돕습니다.",
    likes: 9,
    views: 143,
    owner: "테스터4",
    knowledge: "구매 정책",
    scope: "구매 조직",
    prompts: ["견적 비교", "공급사 평가", "계약 조건 정리", "리스크 분석"],
  },
  {
    id: "s6",
    initial: "물",
    name: "물류 운영 Assistant",
    categoryCode: "LOG",
    category: "물류",
    model: "Internal Reasoning",
    description: "물류 운영 이슈 해결과 최적화를 지원합니다.",
    likes: 8,
    views: 190,
    owner: "테스터5",
    knowledge: "물류 가이드",
    scope: "물류 조직",
    prompts: [
      "배송 지연 원인",
      "재고 이슈 정리",
      "운영 리포트",
      "비용 절감 아이디어",
    ],
  },
]);

const draft = reactive({
  image: "",
  category: "MKT",
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

const selectedCategoryLabel = computed(
  () =>
    categoryOptions.value.find((item) => item.value === draft.category)
      ?.label || "카테고리 선택"
);
const studioCategoryChips = computed(() => studioCategoryOptions.value);
const availableAuthorities = computed(() => {
  const selected = new Set(
    selectedAuthorities.value.map((item) => item.deptId)
  );
  return authorityOptions.value.filter((item) => !selected.has(item.deptId));
});
const allAuthoritiesChecked = computed(
  () =>
    selectedAuthorities.value.length > 0 &&
    selectedAuthorities.value.every((item) => item.checked)
);
const filteredStudios = computed(() => {
  const keyword = submittedSearchText.value.trim().toLowerCase();
  return studios.value.filter((studio) => {
    const matchedTab = activeTab.value === "all" || studio.owner === "테스터1";
    const matchedCategory =
      activeTab.value !== "all" ||
      activeCategory.value === "ALL" ||
      studio.categoryCode === activeCategory.value;
    const matchedKeyword =
      !keyword ||
      `${studio.name} ${studio.description} ${studio.category}`
        .toLowerCase()
        .includes(keyword);
    return matchedTab && matchedCategory && matchedKeyword;
  });
});
const maxPage = computed(() =>
  Math.max(1, Math.ceil(filteredStudios.value.length / pageSize))
);
const pagedStudios = computed(() =>
  filteredStudios.value.slice(
    (currentPage.value - 1) * pageSize,
    currentPage.value * pageSize
  )
);
const paginationPages = computed(() => {
  const last = maxPage.value;
  if (last <= 7) {
    return Array.from({length: last}, (_, index) => ({
      key: `p${index + 1}`,
      value: index + 1,
      label: String(index + 1),
    }));
  }
  const pages = [{key: "p1", value: 1, label: "1"}];
  if (currentPage.value > 4)
    pages.push({key: "dots-start", label: "...", ellipsis: true});
  const start = Math.max(2, currentPage.value - 1);
  const end = Math.min(last - 1, currentPage.value + 1);
  for (let page = start; page <= end; page += 1)
    pages.push({key: `p${page}`, value: page, label: String(page)});
  if (currentPage.value < last - 3)
    pages.push({key: "dots-end", label: "...", ellipsis: true});
  pages.push({key: `p${last}`, value: last, label: String(last)});
  return pages;
});
const previewInitial = computed(() =>
  (preview.name || "A").slice(0, 1).toUpperCase()
);
const previewPrompts = computed(() =>
  preview.prompts.filter(Boolean).slice(0, 4)
);

watch(activeTab, () => {
  currentPage.value = 1;
});
watch(activeCategory, () => {
  currentPage.value = 1;
});
watch(isMobile, (mobile) => {
  if (mobile && selectedStudio.value) {
    mobileDetailStudio.value = selectedStudio.value;
    selectedStudio.value = null;
  }
});

onMounted(loadStudioData);

async function loadStudioData() {
  await Promise.allSettled([
    loadMainInfo(),
    loadAuthorityInfo(),
    loadStudioList(),
  ]);
}
async function loadMainInfo() {
  try {
    const response = await httpClient.get("/studio/search/main/info.do");
    const data = unwrapResponseData(response, {});
    if (Array.isArray(data.sysInfoList) && data.sysInfoList.length) {
      studioCategoryOptions.value = data.sysInfoList
        .filter((item) => item.studio_cat_use_yn !== false)
        .map((item) => ({
          value: item.studio_cat_code,
          label:
            item.studio_cat_name_ko ||
            item.studio_cat_name_en ||
            item.studio_cat_code,
          description: item.studio_cat_desc_ko || item.studio_cat_desc_en || "",
        }));
      if (!studioCategoryOptions.value.some((item) => item.value === "ALL")) {
        studioCategoryOptions.value = [
          {value: "ALL", label: "전체", description: "전체"},
          ...studioCategoryOptions.value,
        ];
      }
      categoryOptions.value = studioCategoryOptions.value.filter(
        (item) => item.value !== "ALL"
      );
      if (!categoryOptions.value.some((item) => item.value === draft.category))
        draft.category = categoryOptions.value[0]?.value || "";
    }
    if (Array.isArray(data.studioModelList) && data.studioModelList.length) {
      modelOptions.value = data.studioModelList.map((item) => ({
        value: item.model_id || item.model_name,
        label: item.model_name,
        description: item.model_desc_ko || item.model_desc_en || "",
      }));
    }
    if (Array.isArray(data.ragDataList))
      ragOptions.value = data.ragDataList
        .map((item) => item.label || item.name || item.id)
        .filter(Boolean);
    if (Array.isArray(data.mcpPluginList))
      mcpOptions.value = data.mcpPluginList
        .map((item) => item.label || item.name || item.id)
        .filter(Boolean);
  } catch (error) {
    // 백엔드 미연결 개발 환경에서는 기본 mock 데이터를 유지합니다.
  }
}
async function loadAuthorityInfo() {
  try {
    const response = await httpClient.get("/studio/main/ssg/info");
    const data = unwrapResponseData(response, []);
    if (Array.isArray(data) && data.length)
      authorityOptions.value = data.map((item) => ({...item, checked: false}));
  } catch (error) {
    // 백엔드 미연결 개발 환경에서는 기본 mock 데이터를 유지합니다.
  }
}
async function loadStudioList() {
  try {
    const response = await httpClient.get("/studio/search/list.do", {
      params: {pageNo: 1, pagePerCnt: 20, categoryId: "", topCnt: 4},
    });
    const data = unwrapResponseData(response, []);
    if (Array.isArray(data) && data.length)
      studios.value = data.map(normalizeStudioItem);
  } catch (error) {
    // 백엔드 미연결 개발 환경에서는 기본 mock 데이터를 유지합니다.
  }
}
function normalizeStudioItem(item, index) {
  const model = parseFirstModelName(item.conn_model_name) || "GPT-OSS";
  const name = item.studio_name || `Studio ${index + 1}`;
  return {
    id: item.sutdio_id || item.studio_id || `studio-${index}`,
    initial: name.slice(0, 1).toUpperCase(),
    name,
    categoryCode: item.studio_cat_code || "COMMON",
    category:
      item.studio_cat_name_ko ||
      item.studio_cat_name_en ||
      item.studio_cat_code ||
      "공통/기타",
    model,
    description: item.studio_desc || "스튜디오 설명",
    likes: Number(item.studio_like_cnt || 0),
    views: Number(item.studio_watch_cnt || 0),
    owner: item.user_name || item.user_id || "사용자",
    knowledge: item.assist_ssg_auth_arr || "학습 사내 지식 없음",
    scope: item.assist_ssg_auth_yn ? "권한 공개" : "전체 공개",
    prompts: [
      "신제품 캠페인 기획",
      "SNS 문구 작성",
      "타깃 분석",
      "성과 리포트 요약",
    ],
  };
}
function parseFirstModelName(value) {
  if (Array.isArray(value)) return value[0];
  if (typeof value !== "string") return "";
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed[0];
  } catch (error) {
    return value
      .replace(/\[|\]|"/g, "")
      .split(",")[0]
      ?.trim();
  }
  return value;
}
function runSearch() {
  submittedSearchText.value = searchText.value;
  currentPage.value = 1;
}
function selectListCategory(value) {
  activeCategory.value = value;
}
function goPage(page) {
  currentPage.value = Math.min(maxPage.value, Math.max(1, page));
}
function openDetail(studio) {
  if (isMobile.value) mobileDetailStudio.value = studio;
  else selectedStudio.value = studio;
}
function openCreate() {
  createOpen.value = true;
  createTab.value = "basic";
}
function closeCreate() {
  createOpen.value = false;
  categorySelectorOpen.value = false;
  authorityPickerOpen.value = false;
}
function applyPreview() {
  preview.name = draft.name;
  preview.description = draft.description;
  preview.prompts = [...draft.prompts];
}
function openCategorySelector() {
  categorySelectorOpen.value = true;
}
function selectCategory(value) {
  draft.category = value;
  categorySelectorOpen.value = false;
}
function addAuthority(auth) {
  selectedAuthorities.value = [
    ...selectedAuthorities.value,
    {...auth, checked: false},
  ];
  authorityPickerOpen.value = false;
}
function deleteCheckedAuthorities() {
  selectedAuthorities.value = selectedAuthorities.value.filter(
    (item) => !item.checked
  );
}
function toggleAllAuthorities(event) {
  selectedAuthorities.value = selectedAuthorities.value.map((item) => ({
    ...item,
    checked: event.target.checked,
  }));
}
</script>
