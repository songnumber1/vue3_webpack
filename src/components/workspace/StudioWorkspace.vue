<template>
  <section class="studio-workspace" aria-label="Assistant Studio">
    <StudioCreateWorkspace
      v-if="createOpen"
      :create-tab="createTab"
      :draft="draft"
      :preview="preview"
      :preview-initial="previewInitial"
      :preview-prompts="previewPrompts"
      :selected-category-label="selectedCategoryLabel"
      :category-options="categoryOptions"
      :model-options="modelOptions"
      :rag-options="ragOptions"
      :mcp-options="mcpOptions"
      :selected-authorities="selectedAuthorities"
      :available-authorities="availableAuthorities"
      :all-authorities-checked="allAuthoritiesChecked"
      @close="closeCreate"
      @apply-preview="applyPreview"
      @update-create-tab="createTab = $event"
      @update-draft-field="updateDraftField"
      @update-draft-prompt="updateDraftPrompt"
      @toggle-model="toggleModel"
      @update-rags="draft.rags = $event"
      @update-mcps="draft.mcps = $event"
      @update-scope="draft.scope = $event"
      @add-authority="addAuthority"
      @delete-checked-authorities="deleteCheckedAuthorities"
      @toggle-all-authorities="toggleAllAuthorities"
      @toggle-authority="toggleAuthority"
    />

    <StudioMainWorkspace
      v-else
      :search-text="searchText"
      :active-tab="activeTab"
      :active-category="activeCategory"
      :active-category-label="selectedListCategoryLabel"
      :categories="studioCategoryChips"
      :studios="pagedStudios"
      :pages="paginationPages"
      :current-page="currentPage"
      :max-page="maxPage"
      @update-search-text="searchText = $event"
      @search="runSearch"
      @update-active-tab="activeTab = $event"
      @select-category="selectListCategory"
      @open-create="openCreate"
      @go-page="goPage"
    />
  </section>
</template>

<script setup>
/**
 * @file components/workspace/StudioWorkspace.vue
 * @description 공통 AppShell 내부에 라우터로 마운트되는 Assistant Studio workspace입니다.
 * 화면 전환과 Studio 상태 연결만 담당하고 실제 UI는 views/studio/components로 분리합니다.
 */
import {computed, onMounted, reactive, ref, watch} from "vue";
import StudioMainWorkspace from "@/views/studio/components/StudioMainWorkspace.vue";
import StudioCreateWorkspace from "@/views/studio/components/StudioCreateWorkspace.vue";
import {httpClient, unwrapResponseData} from "@/api/clients/httpClient";

const searchText = ref("");
const activeTab = ref("all");
const activeCategory = ref("ALL");
const currentPage = ref(1);
const pageSize = 6;
const submittedSearchText = ref("");
const createOpen = ref(false);
const createTab = ref("basic");


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
  {value: "INFRA", label: "인프라/환경안정", description: "인프라/환경안정 설명"},
  {value: "COMMON", label: "공통/기타", description: "공통 설명"},
]);
const categoryOptions = ref(studioCategoryOptions.value.filter((item) => item.value !== "ALL"));
const modelOptions = ref([
  {value: "gpt-oss", label: "GPT-OSS", description: "빠른 추론 결과 도출 가능"},
  {value: "gemma-3", label: "Gemma 3", description: "문서 기반 요약과 분석에 적합"},
  {value: "claude", label: "Claude", description: "긴 문맥 분석에 적합"},
  {value: "internal-reasoning", label: "Internal Reasoning", description: "사내 추론 워크로드용"},
]);
const ragOptions = ref(["논문", "Confluence", "Jira", "사내 규정", "기술 문서"]);
const mcpOptions = ref(["메일", "캘린더", "파일 검색", "GitHub", "배포 조회"]);
const authorityOptions = ref([
  {checked: false, deptId: "auth1", deptCode: "auth1", deptNameKo: "auth1 권한", description: "auth1 권한 설명"},
]);
const selectedAuthorities = ref([
  {checked: false, deptId: "auth1", deptCode: "auth1", deptNameKo: "auth1 권한", description: "auth1 권한 설명"},
]);

const studios = ref([
  {id: "s1", initial: "마", name: "마케팅 캠페인 Assistant", categoryCode: "MKT", category: "마케팅", model: "GPT-OSS", description: "캠페인 기획과 문구 작성을 지원합니다.", likes: 24, views: 582, owner: "테스터1", knowledge: "마케팅 정책, 캠페인 가이드", scope: "전체 공개", prompts: ["신제품 캠페인 기획", "SNS 문구 작성", "타깃 분석", "성과 리포트 요약"]},
  {id: "s2", initial: "개", name: "개발 문서 Assistant", categoryCode: "DEV", category: "개발", model: "Gemma 3", description: "개발 표준과 API 문서 탐색을 지원합니다.", likes: 18, views: 311, owner: "테스터2", knowledge: "Confluence, Jira", scope: "개발 조직", prompts: ["API 요약", "장애 원인 정리", "PR 설명 작성", "릴리즈 노트"]},
  {id: "s3", initial: "품", name: "품질 점검 Assistant", categoryCode: "QA", category: "품질", model: "GPT-OSS", description: "품질 기준과 체크리스트를 기반으로 점검합니다.", likes: 11, views: 214, owner: "테스터3", knowledge: "품질 매뉴얼", scope: "전체 공개", prompts: ["점검표 생성", "리스크 정리", "불량 유형 분석", "보고서 작성"]},
  {id: "s4", initial: "경", name: "경영 KPI Assistant", categoryCode: "MGMT", category: "경영관리", model: "Claude", description: "경영 KPI 분석과 리포트 작성을 지원합니다.", likes: 15, views: 267, owner: "테스터1", knowledge: "경영 리포트", scope: "전체 공개", prompts: ["월간 KPI 요약", "실적 차이 분석", "임원 보고서 초안", "리스크 정리"]},
  {id: "s5", initial: "구", name: "구매 견적 Assistant", categoryCode: "PUR", category: "구매", model: "GPT-OSS", description: "견적 비교 및 공급사 분석을 돕습니다.", likes: 9, views: 143, owner: "테스터4", knowledge: "구매 정책", scope: "구매 조직", prompts: ["견적 비교", "공급사 평가", "계약 조건 정리", "리스크 분석"]},
  {id: "s6", initial: "물", name: "물류 운영 Assistant", categoryCode: "LOG", category: "물류", model: "Internal Reasoning", description: "물류 운영 이슈 해결과 최적화를 지원합니다.", likes: 8, views: 190, owner: "테스터5", knowledge: "물류 가이드", scope: "물류 조직", prompts: ["배송 지연 원인", "재고 이슈 정리", "운영 리포트", "비용 절감 아이디어"]},
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

const selectedCategoryLabel = computed(() => categoryOptions.value.find((item) => item.value === draft.category)?.label || "카테고리 선택");
const selectedListCategoryLabel = computed(() => studioCategoryOptions.value.find((item) => item.value === activeCategory.value)?.label || "전체");
const studioCategoryChips = computed(() => studioCategoryOptions.value);
const availableAuthorities = computed(() => {
  const selected = new Set(selectedAuthorities.value.map((item) => item.deptId));
  return authorityOptions.value.filter((item) => !selected.has(item.deptId));
});
const allAuthoritiesChecked = computed(() => selectedAuthorities.value.length > 0 && selectedAuthorities.value.every((item) => item.checked));
const filteredStudios = computed(() => {
  const keyword = submittedSearchText.value.trim().toLowerCase();
  return studios.value.filter((studio) => {
    const matchedTab = activeTab.value === "all" || studio.owner === "테스터1";
    const matchedCategory = activeTab.value !== "all" || activeCategory.value === "ALL" || studio.categoryCode === activeCategory.value;
    const matchedKeyword = !keyword || `${studio.name} ${studio.description} ${studio.category}`.toLowerCase().includes(keyword);
    return matchedTab && matchedCategory && matchedKeyword;
  });
});
const maxPage = computed(() => Math.max(1, Math.ceil(filteredStudios.value.length / pageSize)));
const pagedStudios = computed(() => filteredStudios.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize));
const paginationPages = computed(() => {
  const last = maxPage.value;
  if (last <= 7) return Array.from({length: last}, (_, index) => ({key: `p${index + 1}`, value: index + 1, label: String(index + 1)}));
  const pages = [{key: "p1", value: 1, label: "1"}];
  if (currentPage.value > 4) pages.push({key: "dots-start", label: "...", ellipsis: true});
  const start = Math.max(2, currentPage.value - 1);
  const end = Math.min(last - 1, currentPage.value + 1);
  for (let page = start; page <= end; page += 1) pages.push({key: `p${page}`, value: page, label: String(page)});
  if (currentPage.value < last - 3) pages.push({key: "dots-end", label: "...", ellipsis: true});
  pages.push({key: `p${last}`, value: last, label: String(last)});
  return pages;
});
const previewInitial = computed(() => (preview.name || "A").slice(0, 1).toUpperCase());
const previewPrompts = computed(() => preview.prompts.filter(Boolean).slice(0, 4));

watch(activeTab, () => {
  currentPage.value = 1;
});
watch(activeCategory, () => {
  currentPage.value = 1;
});
onMounted(loadStudioData);

async function loadStudioData() {
  await Promise.allSettled([loadMainInfo(), loadAuthorityInfo(), loadStudioList()]);
}
async function loadMainInfo() {
  try {
    const response = await httpClient.get("/studio/search/main/info.do");
    const data = unwrapResponseData(response, {});
    if (Array.isArray(data.sysInfoList) && data.sysInfoList.length) {
      studioCategoryOptions.value = data.sysInfoList
        .filter((item) => item.studio_cat_use_yn !== false)
        .map((item) => ({value: item.studio_cat_code, label: item.studio_cat_name_ko || item.studio_cat_name_en || item.studio_cat_code, description: item.studio_cat_desc_ko || item.studio_cat_desc_en || ""}));
      if (!studioCategoryOptions.value.some((item) => item.value === "ALL")) studioCategoryOptions.value = [{value: "ALL", label: "전체", description: "전체"}, ...studioCategoryOptions.value];
      categoryOptions.value = studioCategoryOptions.value.filter((item) => item.value !== "ALL");
      if (!categoryOptions.value.some((item) => item.value === draft.category)) draft.category = categoryOptions.value[0]?.value || "";
    }
    if (Array.isArray(data.studioModelList) && data.studioModelList.length) {
      modelOptions.value = data.studioModelList.map((item) => ({value: item.model_id || item.model_name, label: item.model_name, description: item.model_desc_ko || item.model_desc_en || ""}));
    }
    if (Array.isArray(data.ragDataList)) ragOptions.value = data.ragDataList.map((item) => item.label || item.name || item.id).filter(Boolean);
    if (Array.isArray(data.mcpPluginList)) mcpOptions.value = data.mcpPluginList.map((item) => item.label || item.name || item.id).filter(Boolean);
  } catch (error) {
    // 백엔드 미연결 개발 환경에서는 기본 mock 데이터를 유지합니다.
  }
}
async function loadAuthorityInfo() {
  try {
    const response = await httpClient.get("/studio/main/ssg/info");
    const data = unwrapResponseData(response, []);
    if (Array.isArray(data) && data.length) authorityOptions.value = data.map((item) => ({...item, checked: false}));
  } catch (error) {
    // 백엔드 미연결 개발 환경에서는 기본 mock 데이터를 유지합니다.
  }
}
async function loadStudioList() {
  try {
    const response = await httpClient.get("/studio/search/list.do", {params: {pageNo: 1, pagePerCnt: 20, categoryId: "", topCnt: 4}});
    const data = unwrapResponseData(response, []);
    if (Array.isArray(data) && data.length) studios.value = data.map(normalizeStudioItem);
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
    category: item.studio_cat_name_ko || item.studio_cat_name_en || item.studio_cat_code || "공통/기타",
    model,
    description: item.studio_desc || "스튜디오 설명",
    likes: Number(item.studio_like_cnt || 0),
    views: Number(item.studio_watch_cnt || 0),
    owner: item.user_name || item.user_id || "사용자",
    knowledge: item.assist_ssg_auth_arr || "학습 사내 지식 없음",
    scope: item.assist_ssg_auth_yn ? "권한 공개" : "전체 공개",
    prompts: ["신제품 캠페인 기획", "SNS 문구 작성", "타깃 분석", "성과 리포트 요약"],
  };
}
function parseFirstModelName(value) {
  if (Array.isArray(value)) return value[0];
  if (typeof value !== "string") return "";
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed[0];
  } catch (error) {
    return value.replace(/\[|\]|"/g, "").split(",")[0]?.trim();
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
function openCreate() {
  createOpen.value = true;
  createTab.value = "basic";
}
function closeCreate() {
  createOpen.value = false;
}
function applyPreview() {
  preview.name = draft.name;
  preview.description = draft.description;
  preview.prompts = [...draft.prompts];
}
function updateDraftField(field, value) {
  draft[field] = value;
}
function updateDraftPrompt(index, value) {
  draft.prompts[index] = value;
}
function toggleModel(value) {
  draft.models = draft.models.includes(value)
    ? draft.models.filter((item) => item !== value)
    : [...draft.models, value];
}
function addAuthority(auth) {
  selectedAuthorities.value = [...selectedAuthorities.value, {...auth, checked: false}];
}
function deleteCheckedAuthorities() {
  selectedAuthorities.value = selectedAuthorities.value.filter((item) => !item.checked);
}
function toggleAllAuthorities(checked) {
  selectedAuthorities.value = selectedAuthorities.value.map((item) => ({...item, checked}));
}
function toggleAuthority(deptId, checked) {
  selectedAuthorities.value = selectedAuthorities.value.map((item) => item.deptId === deptId ? {...item, checked} : item);
}
</script>
