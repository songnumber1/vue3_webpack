<template>
  <section
    class="studio-workspace tw-flex tw-h-full tw-min-h-0 tw-w-full tw-min-w-0 tw-flex-col tw-overflow-hidden tw-bg-studio-bg tw-text-studio-text"
    aria-label="Connector Store"
  >
    <ChatHeader
      v-if="!mobileDetailMcp"
      mode="studio"
      :assistant-label="workspaceState.assistantLabel"
      :assistant="workspaceState.assistant"
      conversation-title="Connector Store"
      :theme-name="workspaceState.themeName"
    />

    <McpMobileDetailPage
      v-if="mobileDetailMcp"
      :mcp="mobileDetailMcp"
      @close="closeDetail"
    />

    <McpMainPage
      v-else
      :search-text="searchText"
      :active-tab="activeTab"
      :active-category="activeCategory"
      :active-category-label="selectedListCategoryLabel"
      :created-only="createdOnly"
      :categories="mcpCategoryChips"
      :mcps="pagedMcps"
      :pages="paginationPages"
      :current-page="currentPage"
      :max-page="maxPage"
      @update-search-text="searchText = $event"
      @search="runSearch"
      @update-active-tab="activeTab = $event"
      @select-category="selectListCategory"
      @update-created-only="createdOnly = $event"
      @open-category-picker="categorySelectorOpen = true"
      @open-create="openReadyDialog"
      @open-detail="openDetail"
      @go-page="goPage"
    />

    <StudioCategoryPicker
      :open="categorySelectorOpen"
      :categories="mcpCategoryChips"
      :selected-value="activeCategory"
      @close="categorySelectorOpen = false"
      @select="selectListCategoryFromPicker"
    />

    <div
      v-if="readyDialogOpen"
      class="studio-confirm-backdrop tw-fixed tw-inset-0 tw-z-modal"
    >
      <article
        class="studio-confirm-dialog tw-bg-studio-surface tw-text-studio-text"
        role="dialog"
        aria-modal="true"
        :aria-label="t('mcp.ready.title')"
      >
        <header class="studio-confirm-dialog__head">
          <strong>{{ t("mcp.ready.title") }}</strong>
          <button
            type="button"
            :aria-label="t('common.close')"
            @click="readyDialogOpen = false"
          >
            ×
          </button>
        </header>
        <p>{{ t("mcp.ready.message") }}</p>
        <footer class="studio-confirm-dialog__footer">
          <button
            class="studio-button studio-button--primary"
            type="button"
            @click="readyDialogOpen = false"
          >
            {{ t("common.confirm") }}
          </button>
        </footer>
      </article>
    </div>
  </section>
</template>

<script setup>
import {computed, inject, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import McpMainPage from "@/components/mcp/McpMainPage.vue";
import McpMobileDetailPage from "@/components/mcp/McpMobileDetailPage.vue";
import StudioCategoryPicker from "@/components/studio/StudioCategoryPicker.vue";
import {mcpApiLive} from "@/api/live/mcpApi.live";
import {adaptMcpList, adaptMcpMainInfo} from "@/adapters/mcpResponseAdapter";
import {
  createEmptyWorkspaceState,
  CHAT_WORKSPACE_STATE_KEY,
} from "@/composables/chat/chatStateContext";
import {createStudioPaginationPages} from "@/composables/studio/studioPagination";
import {useOverlayBackClose} from "@/composables/overlay/useOverlayBackClose";

const {t, locale} = useI18n();
const injectedWorkspaceState = inject(
  CHAT_WORKSPACE_STATE_KEY,
  computed(createEmptyWorkspaceState)
);
const workspaceState = computed(
  () => injectedWorkspaceState.value || createEmptyWorkspaceState()
);

const searchText = ref("");
const activeTab = ref("all");
const activeCategory = ref("ALL");
const createdOnly = ref(false);
const currentPage = ref(1);
const pageSize = 6;
const submittedSearchText = ref("");
const readyDialogOpen = ref(false);
const mobileDetailMcp = ref(null);
const mcpDetailOpen = computed(() => Boolean(mobileDetailMcp.value));
useOverlayBackClose({
  isOpen: mcpDetailOpen,
  close: closeDetail,
  historyValue: "mcp-detail",
});
const categorySelectorOpen = ref(false);
const usesDefaultMcpData = ref(true);
const mcpCategoryOptions = ref(createDefaultCategoryOptions());
const mcps = ref(createDefaultMcps());

const selectedListCategoryLabel = computed(
  () =>
    mcpCategoryOptions.value.find((item) => item.value === activeCategory.value)
      ?.label || t("mcp.defaults.all")
);
const mcpCategoryChips = computed(() => mcpCategoryOptions.value);
const filteredMcps = computed(() => {
  const keyword = submittedSearchText.value.trim().toLowerCase();
  return mcps.value.filter((mcp) => {
    const matchedTab =
      activeTab.value === "all" ||
      (createdOnly.value ? Boolean(mcp.isCreated) : Boolean(mcp.isMine));
    const matchedCategory =
      activeTab.value !== "all" ||
      activeCategory.value === "ALL" ||
      mcp.categoryCode === activeCategory.value;
    const matchedKeyword =
      !keyword ||
      `${mcp.name} ${mcp.description} ${mcp.category} ${mcp.knowledge}`
        .toLowerCase()
        .includes(keyword);
    return matchedTab && matchedCategory && matchedKeyword;
  });
});
const maxPage = computed(() =>
  Math.max(1, Math.ceil(filteredMcps.value.length / pageSize))
);
const pagedMcps = computed(() =>
  filteredMcps.value.slice(
    (currentPage.value - 1) * pageSize,
    currentPage.value * pageSize
  )
);
const paginationPages = computed(() =>
  createStudioPaginationPages(currentPage.value, maxPage.value)
);

watch(activeTab, () => {
  currentPage.value = 1;
  if (activeTab.value !== "all") categorySelectorOpen.value = false;
});
watch(activeCategory, () => {
  currentPage.value = 1;
});
watch(createdOnly, () => {
  currentPage.value = 1;
});
watch(locale, () => {
  if (usesDefaultMcpData.value) {
    mcpCategoryOptions.value = createDefaultCategoryOptions();
    mcps.value = createDefaultMcps();
  }
});

onMounted(loadMcpData);

function createDefaultCategoryOptions() {
  return [
    {
      value: "ALL",
      label: t("mcp.defaults.all"),
      description: t("mcp.defaults.allDescription"),
    },
    {
      value: "COMM",
      label: locale.value === "en" ? "Communication" : "커뮤니케이션",
      description:
        locale.value === "en"
          ? "Communication connectors"
          : "커뮤니케이션 커넥터",
    },
    {
      value: "DEV",
      label: locale.value === "en" ? "Development" : "개발",
      description:
        locale.value === "en" ? "Development connectors" : "개발 커넥터",
    },
    {
      value: "DOC",
      label: locale.value === "en" ? "Documents" : "문서",
      description:
        locale.value === "en" ? "Document connectors" : "문서 커넥터",
    },
    {
      value: "OPS",
      label: locale.value === "en" ? "Operations" : "운영",
      description:
        locale.value === "en" ? "Operations connectors" : "운영 커넥터",
    },
  ];
}

function createDefaultPromptExamples() {
  return locale.value === "en"
    ? [
        "Search related messages",
        "Summarize recent updates",
        "Find linked documents",
        "Create action items",
      ]
    : [
        "관련 메시지 검색",
        "최근 업데이트 요약",
        "연결 문서 찾기",
        "액션 아이템 생성",
      ];
}

function createDefaultMcps() {
  if (locale.value === "en") {
    return [
      createMcp(
        "mcp-mail",
        "M",
        "Mail Connector",
        "COMM",
        "Communication",
        "Mail",
        "Search and summarize work mail.",
        18,
        421,
        "Tester 1",
        true,
        true,
        "Mail, contacts",
        "My workspace"
      ),
      createMcp(
        "mcp-calendar",
        "C",
        "Calendar Connector",
        "COMM",
        "Communication",
        "Calendar",
        "Find schedules and prepare meeting context.",
        11,
        308,
        "Tester 2",
        true,
        false,
        "Calendar",
        "Subscribed"
      ),
      createMcp(
        "mcp-github",
        "G",
        "GitHub Connector",
        "DEV",
        "Development",
        "GitHub",
        "Search repositories, issues, and pull requests.",
        25,
        712,
        "Tester 3",
        false,
        false,
        "GitHub repositories",
        "Public"
      ),
      createMcp(
        "mcp-docs",
        "D",
        "Document Connector",
        "DOC",
        "Documents",
        "File search",
        "Search and summarize internal documents.",
        14,
        266,
        "Tester 1",
        true,
        true,
        "Drive, file search",
        "My workspace"
      ),
      createMcp(
        "mcp-deploy",
        "O",
        "Deployment Lookup Connector",
        "OPS",
        "Operations",
        "Deployment",
        "Look up deployment history and release notes.",
        7,
        154,
        "Tester 4",
        false,
        false,
        "Deployment logs",
        "Public"
      ),
      createMcp(
        "mcp-jira",
        "J",
        "Jira Connector",
        "DEV",
        "Development",
        "Jira",
        "Search issues and sprint progress.",
        16,
        382,
        "Tester 2",
        true,
        false,
        "Jira projects",
        "Subscribed"
      ),
    ];
  }
  return [
    createMcp(
      "mcp-mail",
      "메",
      "메일 Connector",
      "COMM",
      "커뮤니케이션",
      "메일",
      "업무 메일을 검색하고 요약합니다.",
      18,
      421,
      "테스터1",
      true,
      true,
      "메일, 연락처",
      "내 워크스페이스"
    ),
    createMcp(
      "mcp-calendar",
      "캘",
      "캘린더 Connector",
      "COMM",
      "커뮤니케이션",
      "캘린더",
      "일정과 회의 맥락을 확인합니다.",
      11,
      308,
      "테스터2",
      true,
      false,
      "캘린더",
      "구독 중"
    ),
    createMcp(
      "mcp-github",
      "깃",
      "GitHub Connector",
      "DEV",
      "개발",
      "GitHub",
      "저장소, 이슈, PR을 검색합니다.",
      25,
      712,
      "테스터3",
      false,
      false,
      "GitHub 저장소",
      "전체 공개"
    ),
    createMcp(
      "mcp-docs",
      "문",
      "문서 Connector",
      "DOC",
      "문서",
      "파일 검색",
      "사내 문서를 검색하고 요약합니다.",
      14,
      266,
      "테스터1",
      true,
      true,
      "Drive, 파일 검색",
      "내 워크스페이스"
    ),
    createMcp(
      "mcp-deploy",
      "배",
      "배포 조회 Connector",
      "OPS",
      "운영",
      "배포 조회",
      "배포 이력과 릴리즈 노트를 조회합니다.",
      7,
      154,
      "테스터4",
      false,
      false,
      "배포 로그",
      "전체 공개"
    ),
    createMcp(
      "mcp-jira",
      "지",
      "Jira Connector",
      "DEV",
      "개발",
      "Jira",
      "이슈와 스프린트 진행 상황을 검색합니다.",
      16,
      382,
      "테스터2",
      true,
      false,
      "Jira 프로젝트",
      "구독 중"
    ),
  ];
}

function createMcp(
  id,
  initial,
  name,
  categoryCode,
  category,
  model,
  description,
  likes,
  views,
  owner,
  isMine,
  isCreated,
  knowledge,
  scope
) {
  return {
    id,
    initial,
    name,
    categoryCode,
    category,
    model,
    description,
    likes,
    views,
    owner,
    isMine,
    isCreated,
    isSubscribed: isMine && !isCreated,
    knowledge,
    scope,
    prompts: createDefaultPromptExamples(),
  };
}

async function loadMcpData() {
  await Promise.allSettled([loadMainInfo(), loadMcpList()]);
}

async function loadMainInfo() {
  try {
    const mainInfo = adaptMcpMainInfo(await mcpApiLive.getMainInfo(), {
      allLabel: t("mcp.defaults.all"),
      allDescription: t("mcp.defaults.allDescription"),
    });
    if (mainInfo.categories.length) {
      mcpCategoryOptions.value = mainInfo.categories;
    }
  } catch (error) {
    // 백엔드 미연결 개발 환경에서는 기본 데이터를 유지합니다.
  }
}

async function loadMcpList() {
  try {
    const data = adaptMcpList(
      await mcpApiLive.searchList({
        pageNo: 1,
        pagePerCnt: 20,
        categoryId: "",
        topCnt: 4,
      }),
      {
        defaultCategory: t("mcp.defaults.common"),
        defaultConnector: t("mcp.defaults.connector"),
        defaultDescription: t("mcp.defaults.description"),
        defaultUser: t("mcp.defaults.user"),
        defaultCapability: t("mcp.defaults.capability"),
        publicScope: t("mcp.defaults.publicScope"),
        createPromptExamples: createDefaultPromptExamples,
      }
    );
    if (data.length) {
      mcps.value = data;
      usesDefaultMcpData.value = false;
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
  categorySelectorOpen.value = false;
}

function openDetail(mcp) {
  mobileDetailMcp.value = mcp;
}

function closeDetail() {
  mobileDetailMcp.value = null;
}

function goPage(page) {
  currentPage.value = Math.min(maxPage.value, Math.max(1, page));
}

function openReadyDialog() {
  readyDialogOpen.value = true;
}
</script>
