<template>
  <section
    class="studio-workspace tw-flex tw-h-full tw-min-h-0 tw-w-full tw-min-w-0 tw-flex-col tw-overflow-hidden tw-bg-studio-bg tw-text-studio-text"
    aria-label="Assistant Studio"
  >
    <template v-if="createOpen">
      <StudioCreatePage />

      <StudioCategoryPicker
        :open="categorySelectorOpen"
        :categories="categoryOptions"
        :selected-value="draft.category"
        @close="categorySelectorOpen = false"
        @select="selectCreateCategory"
      />

      <StudioAuthorityPicker
        :open="authorityPickerOpen"
        :authorities="availableAuthorities"
        @close="authorityPickerOpen = false"
        @add="addAuthorityFromPicker"
      />
    </template>

    <div
      v-else-if="isResolvingEdit"
      class="studio-edit-bootstrap tw-flex tw-min-h-0 tw-flex-1 tw-bg-studio-bg"
      aria-hidden="true"
    ></div>

    <template v-else>
      <ChatHeader
        v-if="!studioDetailOpen"
        :assistant-label="assistantLabel"
        :assistant="assistant"
      />

      <StudioMainPage v-show="!studioDetailOpen" />

      <StudioDetailViewer
        :open="studioDetailOpen"
        :studio="selectedStudio"
        :allow-actions="true"
      />

      <StudioCategoryPicker
        :open="listCategorySelectorOpen && !studioDetailOpen"
        :categories="studioCategoryChips"
        :selected-value="activeCategory"
        @close="listCategorySelectorOpen = false"
        @select="selectListCategoryFromPicker"
      />
    </template>
  </section>
</template>

<script setup>
/**
 * @file components/workspace/StudioWorkspace.vue
 * @description 공통 AppShell 내부에 라우터로 마운트되는 Assistant Studio workspace입니다.
 * 화면 전환과 Studio 상태 연결만 담당하고 실제 UI는 views/studio/components로 분리합니다.
 */
import {computed, onMounted, reactive, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import StudioMainPage from "@/components/studio/StudioMainPage.vue";
import StudioDetailViewer from "@/components/studio/StudioDetailViewer.vue";
import StudioCreatePage from "@/components/studio/StudioCreatePage.vue";
import StudioCategoryPicker from "@/components/studio/StudioCategoryPicker.vue";
import StudioAuthorityPicker from "@/components/studio/StudioAuthorityPicker.vue";
import {studioApiLive} from "@/api/live/studioApi.live";
import {
  adaptStudioAuthorityList,
  adaptStudioList,
  adaptStudioMainInfo,
} from "@/adapters/studioResponseAdapter";
import {useStudioRuntimeStore} from "@/stores/studioRuntimeStore";
import {useChatStore} from "@/stores/chatStore";
import {normalizeStudioDetail} from "@/composables/studio/useStudioDetailModel";
import {createStudioPaginationPages} from "@/composables/studio/studioPagination";
import {useOverlayBackClose} from "@/composables/overlay/useOverlayBackClose";
import {provideStudioDetailActions} from "@/composables/studio/context/studioDetailActionContext";
import {provideStudioCreateForm} from "@/composables/studio/context/studioCreateFormContext";
import {useStudioCreateFormController} from "@/composables/studio/create/useStudioCreateFormController";
import {provideStudioList} from "@/composables/studio/context/studioListContext";
import {useStudioListController} from "@/composables/studio/useStudioListController";


const {t, locale} = useI18n();
const route = useRoute();
const router = useRouter();
const studioRuntimeStore = useStudioRuntimeStore();
const chatStore = useChatStore();
const assistant = computed(() => chatStore.currentAssistant);
const assistantLabel = computed(() => {
  const chatInfo = chatStore.selectedChatInfo;
  const displayLabel = String(chatInfo?.displayAssistantLabel || "").trim();
  if (displayLabel) return displayLabel;

  const chatAssistantLabel = String(chatInfo?.assistantLabel || "").trim();
  if (chatAssistantLabel && !chatInfo?.isModelUnavailable) return chatAssistantLabel;

  return String(assistant.value?.label || "").trim() || t("chat.assistant");
});

const searchText = ref("");
const activeTab = ref("all");
const activeCategory = ref("ALL");
const currentPage = ref(1);
const pageSize = 6;
const submittedSearchText = ref("");
const createOpen = ref(false);
const createTab = ref("basic");
const categorySelectorOpen = ref(false);
const authorityPickerOpen = ref(false);
const listCategorySelectorOpen = ref(false);
const selectedStudio = ref(null);
const studioDetailOpen = computed(() => Boolean(selectedStudio.value));
useOverlayBackClose({
  isOpen: studioDetailOpen,
  close: closeStudioDetail,
  historyValue: "studio-detail",
});
provideStudioDetailActions({
  close: closeStudioDetail,
  edit: editStudioFromDetail,
  delete: deleteStudioFromDetail,
});
const editingStudioId = ref(null);
const isResolvingEdit = ref(false);

const studioCategoryOptions = ref(createDefaultCategoryOptions());
const categoryOptions = ref(
  studioCategoryOptions.value.filter((item) => item.value !== "ALL")
);
const modelOptions = ref(createDefaultModelOptions());
const ragOptions = ref(createDefaultRagOptions());
const mcpOptions = ref(createDefaultMcpOptions());
const authorityOptions = ref(createDefaultAuthorityOptions());
const selectedAuthorities = ref(createDefaultAuthorityOptions());
const usesDefaultStudioData = ref(true);
const studios = ref(createDefaultStudios());

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
      ?.label || t("studio.defaults.selectCategory")
);
const selectedListCategoryLabel = computed(
  () =>
    studioCategoryOptions.value.find(
      (item) => item.value === activeCategory.value
    )?.label || t("studio.defaults.all")
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
    if (studioRuntimeStore.isStudioDeleted(studio.id)) return false;
    const matchedTab = activeTab.value === "all" || Boolean(studio.isMine);
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
const paginationPages = computed(() =>
  createStudioPaginationPages(currentPage.value, maxPage.value)
);
const previewInitial = computed(() =>
  (preview.name || "A").slice(0, 1).toUpperCase()
);
const previewPrompts = computed(() =>
  preview.prompts.filter(Boolean).slice(0, 4)
);

provideStudioList(
  useStudioListController({
    searchText,
    activeTab,
    activeCategory,
    activeCategoryLabel: selectedListCategoryLabel,
    studios: pagedStudios,
    pages: paginationPages,
    currentPage,
    maxPage,
    updateSearchText: (value) => {
      searchText.value = value;
    },
    runSearch,
    updateActiveTab: (value) => {
      activeTab.value = value;
    },
    openCategoryPicker: () => {
      listCategorySelectorOpen.value = true;
    },
    openCreate,
    openDetail: openStudioDetail,
    goPage,
  })
);

provideStudioCreateForm(
  useStudioCreateFormController({
    createTab,
    draft,
    preview,
    previewInitial,
    previewPrompts,
    selectedCategoryLabel,
    categoryOptions,
    modelOptions,
    ragOptions,
    mcpOptions,
    selectedAuthorities,
    allAuthoritiesChecked,
    closeCreate,
    applyPreview,
    updateCreateTab,
    updateDraftField,
    updateDraftPrompt,
    openCategorySelector,
    toggleModel,
    updateRags,
    updateMcps,
    updateScope,
    openAuthorityPicker,
    deleteCheckedAuthorities,
    toggleAllAuthorities,
    toggleAuthority,
  })
);

watch(activeTab, () => {
  currentPage.value = 1;
  if (activeTab.value !== "all") listCategorySelectorOpen.value = false;
});
watch(activeCategory, () => {
  currentPage.value = 1;
});
watch(locale, () => {
  if (usesDefaultStudioData.value) {
    studioCategoryOptions.value = createDefaultCategoryOptions();
    categoryOptions.value = studioCategoryOptions.value.filter(
      (item) => item.value !== "ALL"
    );
    if (!categoryOptions.value.some((item) => item.value === draft.category))
      draft.category = categoryOptions.value[0]?.value || "";
    modelOptions.value = createDefaultModelOptions();
    ragOptions.value = createDefaultRagOptions();
    mcpOptions.value = createDefaultMcpOptions();
    authorityOptions.value = createDefaultAuthorityOptions();
    selectedAuthorities.value = createDefaultAuthorityOptions();
    studios.value = createDefaultStudios();
  }
});
onMounted(async () => {
  isResolvingEdit.value = hasPendingEditRouteOrStore();
  await loadStudioData();
  await applyPendingEditQuery();
});

function createDefaultCategoryOptions() {
  return [
    {
      value: "ALL",
      label: t("studio.defaults.all"),
      description: t("studio.defaults.allDescription"),
    },
    {
      value: "MKT",
      label: locale.value === "en" ? "Marketing" : "마케팅",
      description:
        locale.value === "en" ? "Marketing description" : "마케팅 설명",
    },
    {
      value: "SALES",
      label: locale.value === "en" ? "Sales" : "판매",
      description: locale.value === "en" ? "Sales description" : "판매 설명",
    },
    {
      value: "DEV",
      label: locale.value === "en" ? "Development" : "개발",
      description:
        locale.value === "en" ? "Development description" : "개발 설명",
    },
    {
      value: "MFG",
      label: locale.value === "en" ? "Manufacturing" : "제조",
      description:
        locale.value === "en" ? "Manufacturing description" : "제조 설명",
    },
    {
      value: "QA",
      label: locale.value === "en" ? "Quality" : "품질",
      description: locale.value === "en" ? "Quality description" : "품질 설명",
    },
    {
      value: "MGMT",
      label: locale.value === "en" ? "Management" : "경영관리",
      description:
        locale.value === "en" ? "Management description" : "경영관리 설명",
    },
    {
      value: "PUR",
      label: locale.value === "en" ? "Purchasing" : "구매",
      description:
        locale.value === "en" ? "Purchasing description" : "구매 설명",
    },
    {
      value: "LOG",
      label: locale.value === "en" ? "Logistics" : "물류",
      description:
        locale.value === "en" ? "Logistics description" : "물류 설명",
    },
    {
      value: "INFRA",
      label: locale.value === "en" ? "Infra / Environment" : "인프라/환경안정",
      description:
        locale.value === "en"
          ? "Infra and environment description"
          : "인프라/환경안정 설명",
    },
    {
      value: "COMMON",
      label: t("studio.defaults.common"),
      description: locale.value === "en" ? "Common description" : "공통 설명",
    },
  ];
}

function createDefaultModelOptions() {
  return [
    {
      value: "gpt-oss",
      label: "GPT-OSS",
      description:
        locale.value === "en"
          ? "Enables rapid derivation of inference results"
          : "빠른 추론 결과 도출 가능",
    },
    {
      value: "gemma-3",
      label: "Gemma 3",
      description:
        locale.value === "en"
          ? "Suitable for document-based summary and analysis"
          : "문서 기반 요약과 분석에 적합",
    },
    {
      value: "claude",
      label: "Claude",
      description:
        locale.value === "en"
          ? "Suitable for long-context analysis"
          : "긴 문맥 분석에 적합",
    },
    {
      value: "internal-reasoning",
      label: "Internal Reasoning",
      description:
        locale.value === "en"
          ? "For internal reasoning workloads"
          : "사내 추론 워크로드용",
    },
  ];
}

function createDefaultRagOptions() {
  return locale.value === "en"
    ? [
        "Papers",
        "Confluence",
        "Jira",
        "Internal policies",
        "Technical documents",
      ]
    : ["논문", "Confluence", "Jira", "사내 규정", "기술 문서"];
}

function createDefaultMcpOptions() {
  return locale.value === "en"
    ? ["Mail", "Calendar", "File search", "GitHub", "Deployment lookup"]
    : ["메일", "캘린더", "파일 검색", "GitHub", "배포 조회"];
}

function createDefaultAuthorityOptions() {
  return [
    {
      checked: false,
      deptId: "auth1",
      deptCode: "auth1",
      deptNameKo: locale.value === "en" ? "auth1 authority" : "auth1 권한",
      description:
        locale.value === "en"
          ? "auth1 authority description"
          : "auth1 권한 설명",
    },
  ];
}

function createDefaultPromptExamples() {
  return locale.value === "en"
    ? [
        "Plan a new campaign",
        "Write social copy",
        "Analyze target users",
        "Summarize performance",
      ]
    : ["신제품 캠페인 기획", "SNS 문구 작성", "타깃 분석", "성과 리포트 요약"];
}

function createDefaultStudios() {
  if (locale.value === "en") {
    return [
      {
        id: "s1",
        initial: "M",
        name: "Marketing Campaign Assistant",
        categoryCode: "MKT",
        category: "Marketing",
        model: "GPT-OSS",
        description: "Supports campaign planning and copywriting.",
        likes: 24,
        views: 582,
        owner: "Tester 1",
        isMine: true,
        knowledge: "Marketing policies, campaign guides",
        scope: t("studio.defaults.publicScope"),
        prompts: createDefaultPromptExamples(),
      },
      {
        id: "s2",
        initial: "D",
        name: "Development Docs Assistant",
        categoryCode: "DEV",
        category: "Development",
        model: "Gemma 3",
        description: "Helps explore development standards and API documents.",
        likes: 18,
        views: 311,
        owner: "Tester 2",
        isMine: false,
        knowledge: "Confluence, Jira",
        scope: "Development org",
        prompts: [
          "Summarize API",
          "Organize incident causes",
          "Write PR description",
          "Release notes",
        ],
      },
      {
        id: "s3",
        initial: "Q",
        name: "Quality Check Assistant",
        categoryCode: "QA",
        category: "Quality",
        model: "GPT-OSS",
        description: "Checks against quality standards and checklists.",
        likes: 11,
        views: 214,
        owner: "Tester 3",
        isMine: false,
        knowledge: "Quality manual",
        scope: t("studio.defaults.publicScope"),
        prompts: [
          "Create checklist",
          "Organize risks",
          "Analyze defect types",
          "Write report",
        ],
      },
      {
        id: "s4",
        initial: "K",
        name: "Management KPI Assistant",
        categoryCode: "MGMT",
        category: "Management",
        model: "Claude",
        description: "Supports KPI analysis and report drafting.",
        likes: 15,
        views: 267,
        owner: "Tester 1",
        isMine: true,
        knowledge: "Management reports",
        scope: t("studio.defaults.publicScope"),
        prompts: [
          "Monthly KPI summary",
          "Analyze performance gap",
          "Executive report draft",
          "Risk summary",
        ],
      },
      {
        id: "s5",
        initial: "P",
        name: "Purchasing Quote Assistant",
        categoryCode: "PUR",
        category: "Purchasing",
        model: "GPT-OSS",
        description: "Helps compare quotes and analyze suppliers.",
        likes: 9,
        views: 143,
        owner: "Tester 4",
        isMine: false,
        knowledge: "Purchasing policy",
        scope: "Purchasing org",
        prompts: [
          "Compare quotes",
          "Evaluate suppliers",
          "Organize contract terms",
          "Risk analysis",
        ],
      },
      {
        id: "s6",
        initial: "L",
        name: "Logistics Operations Assistant",
        categoryCode: "LOG",
        category: "Logistics",
        model: "Internal Reasoning",
        description: "Supports logistics issue resolution and optimization.",
        likes: 8,
        views: 190,
        owner: "Tester 5",
        isMine: false,
        knowledge: "Logistics guide",
        scope: "Logistics org",
        prompts: [
          "Cause of delivery delay",
          "Inventory issue summary",
          "Operations report",
          "Cost reduction ideas",
        ],
      },
    ];
  }
  return [
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
      isMine: true,
      knowledge: "마케팅 정책, 캠페인 가이드",
      scope: t("studio.defaults.publicScope"),
      prompts: createDefaultPromptExamples(),
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
      isMine: false,
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
      isMine: false,
      knowledge: "품질 매뉴얼",
      scope: t("studio.defaults.publicScope"),
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
      isMine: true,
      knowledge: "경영 리포트",
      scope: t("studio.defaults.publicScope"),
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
      isMine: false,
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
      isMine: false,
      knowledge: "물류 가이드",
      scope: "물류 조직",
      prompts: [
        "배송 지연 원인",
        "재고 이슈 정리",
        "운영 리포트",
        "비용 절감 아이디어",
      ],
    },
  ];
}

function hasPendingEditRouteOrStore() {
  return Boolean(
    (route.query?.mode === "edit" && route.query?.studioId) ||
    studioRuntimeStore.pendingEditStudioId
  );
}

async function applyPendingEditQuery() {
  const queryStudioId = String(route.query?.studioId || "").trim();
  const shouldEditByQuery = route.query?.mode === "edit" && queryStudioId;
  const pending = studioRuntimeStore.consumePendingEditStudio();
  const pendingStudioId = String(pending.studioId || "").trim();
  const targetStudioId = shouldEditByQuery ? queryStudioId : pendingStudioId;

  if (!targetStudioId) {
    isResolvingEdit.value = false;
    return;
  }

  const pendingStudio =
    pendingStudioId && pendingStudioId === targetStudioId
      ? pending.studio
      : null;
  const target =
    normalizeStudioDetail(pendingStudio) ||
    normalizeStudioDetail(
      studios.value.find((studio) => String(studio.id) === targetStudioId)
    );

  if (target) openEdit(target);
  isResolvingEdit.value = false;
  if (shouldEditByQuery) {
    await router.replace({name: route.name, query: {}}).catch(() => {});
  }
}

async function loadStudioData() {
  await Promise.allSettled([
    loadMainInfo(),
    loadAuthorityInfo(),
    loadStudioList(),
  ]);
}
async function loadMainInfo() {
  try {
    const mainInfo = adaptStudioMainInfo(await studioApiLive.getMainInfo(), {
      allLabel: t("studio.defaults.all"),
      allDescription: t("studio.defaults.allDescription"),
    });
    if (mainInfo.categories.length) {
      studioCategoryOptions.value = mainInfo.categories;
      categoryOptions.value = studioCategoryOptions.value.filter(
        (item) => item.value !== "ALL"
      );
      if (!categoryOptions.value.some((item) => item.value === draft.category))
        draft.category = categoryOptions.value[0]?.value || "";
    }
    if (mainInfo.modelOptions.length)
      modelOptions.value = mainInfo.modelOptions;
    if (mainInfo.ragOptions.length) ragOptions.value = mainInfo.ragOptions;
    if (mainInfo.mcpOptions.length) mcpOptions.value = mainInfo.mcpOptions;
  } catch (error) {
    // 백엔드 미연결 개발 환경에서는 기본 데이터를 유지합니다.
  }
}
async function loadAuthorityInfo() {
  try {
    const data = adaptStudioAuthorityList(
      await studioApiLive.getAuthorityInfo()
    );
    if (data.length) authorityOptions.value = data;
  } catch (error) {
    // 백엔드 미연결 개발 환경에서는 기본 데이터를 유지합니다.
  }
}
async function loadStudioList() {
  try {
    const data = adaptStudioList(
      await studioApiLive.searchList({
        pageNo: 1,
        pagePerCnt: 20,
        categoryId: "",
        topCnt: 4,
      }),
      {
        defaultCategory: t("studio.defaults.common"),
        defaultDescription: t("studio.defaults.studioDescription"),
        defaultUser: t("studio.defaults.user"),
        defaultKnowledge: t("studio.defaults.noKnowledge"),
        publicScope: t("studio.defaults.publicScope"),
        authScope: t("studio.defaults.authScope"),
        createPromptExamples: createDefaultPromptExamples,
      }
    );
    if (data.length) {
      studios.value = data;
      usesDefaultStudioData.value = false;
    }
  } catch (error) {
    // 백엔드 미연결 개발 환경에서는 기본 데이터를 유지합니다.
  }
}
function runSearch() {
  submittedSearchText.value = searchText.value;
  currentPage.value = 1;
}
function selectListCategory(value) {
  activeCategory.value = value;
}
function selectListCategoryFromPicker(value) {
  selectListCategory(value);
  listCategorySelectorOpen.value = false;
}
function openStudioDetail(studio) {
  selectedStudio.value = normalizeStudioDetail(studio);
}
function closeStudioDetail() {
  selectedStudio.value = null;
}
function editStudioFromDetail(studio) {
  selectedStudio.value = null;
  openEdit(studio);
}
function deleteStudioFromDetail(studio) {
  selectedStudio.value = null;
  deleteStudio(studio);
}
function goPage(page) {
  currentPage.value = Math.min(maxPage.value, Math.max(1, page));
}
function createEmptyDraftState() {
  return {
    image: "",
    category: categoryOptions.value[0]?.value || "MKT",
    name: "",
    instruction: "",
    description: "",
    prompts: Array.from({length: 8}, () => ""),
    models: [],
    rags: [],
    mcps: [],
    scope: "private",
  };
}
function assignDraftState(nextDraft) {
  Object.assign(draft, nextDraft);
}
function resetCreateDraft() {
  editingStudioId.value = null;
  assignDraftState(createEmptyDraftState());
  selectedAuthorities.value = createDefaultAuthorityOptions();
  preview.name = "";
  preview.description = "";
  preview.prompts = [];
}
function openCreate() {
  resetCreateDraft();
  createOpen.value = true;
  createTab.value = "basic";
}
function openEdit(studio) {
  if (!studio) return;
  editingStudioId.value = studio.id;
  assignDraftState(createDraftFromStudio(studio));
  selectedAuthorities.value = createDefaultAuthorityOptions();
  preview.name = studio.name || "";
  preview.description = studio.description || "";
  preview.prompts = Array.isArray(studio.prompts) ? [...studio.prompts] : [];
  createOpen.value = true;
  createTab.value = "basic";
}
function closeCreate() {
  createOpen.value = false;
  editingStudioId.value = null;
}
function createDraftFromStudio(studio) {
  const modelValue = modelOptions.value.find(
    (model) => model.label === studio.model
  )?.value;
  const prompts = Array.from(
    {length: 8},
    (_, index) => studio.prompts?.[index] || ""
  );
  return {
    image: "",
    category: studio.categoryCode || categoryOptions.value[0]?.value || "MKT",
    name: studio.name || "",
    instruction: "",
    description: studio.description || "",
    prompts,
    models: modelValue ? [modelValue] : [],
    rags:
      typeof studio.knowledge === "string" &&
      studio.knowledge !== t("studio.defaults.noKnowledge")
        ? studio.knowledge
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    mcps: [],
    scope: String(studio.scope || "").includes(t("studio.defaults.publicScope"))
      ? "public"
      : "private",
  };
}
function deleteStudio(studio) {
  const target = normalizeStudioDetail(studio) || studio;
  const id = String(target?.id || "").trim();
  if (!id) return;

  studioRuntimeStore.markStudioDeleted(id);
  studios.value = studios.value.filter((item) => String(item.id) !== id);
  currentPage.value = Math.min(currentPage.value, maxPage.value);
}
function applyPreview() {
  preview.name = draft.name;
  preview.description = draft.description;
  preview.prompts = [...draft.prompts];
}
function updateCreateTab(tab) {
  createTab.value = tab;
}
function updateDraftField(field, value) {
  draft[field] = value;
}
function updateDraftPrompt(index, value) {
  draft.prompts[index] = value;
}
function openCategorySelector() {
  categorySelectorOpen.value = true;
}
function updateRags(items) {
  draft.rags = items;
}
function updateMcps(items) {
  draft.mcps = items;
}
function updateScope(scope) {
  draft.scope = scope;
}
function openAuthorityPicker() {
  authorityPickerOpen.value = true;
}
function selectCreateCategory(value) {
  updateDraftField("category", value);
  categorySelectorOpen.value = false;
}
function addAuthorityFromPicker(auth) {
  const items = Array.isArray(auth) ? auth : [auth];
  items.forEach(addAuthority);
  authorityPickerOpen.value = false;
}
function toggleModel(value) {
  draft.models = draft.models.includes(value)
    ? draft.models.filter((item) => item !== value)
    : [...draft.models, value];
}
function addAuthority(auth) {
  selectedAuthorities.value = [
    ...selectedAuthorities.value,
    {...auth, checked: false},
  ];
}
function deleteCheckedAuthorities() {
  selectedAuthorities.value = selectedAuthorities.value.filter(
    (item) => !item.checked
  );
}
function toggleAllAuthorities(checked) {
  selectedAuthorities.value = selectedAuthorities.value.map((item) => ({
    ...item,
    checked,
  }));
}
function toggleAuthority(deptId, checked) {
  selectedAuthorities.value = selectedAuthorities.value.map((item) =>
    item.deptId === deptId ? {...item, checked} : item
  );
}
</script>
