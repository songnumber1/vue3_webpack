<template>
  <ChatHeader
    v-if="isMobile && !mobileDetailMcp"
    mode="studio"
    :assistant-label="workspaceState.assistantLabel"
    :assistant="workspaceState.assistant"
    conversation-title="Connector Store"
    :theme-name="workspaceState.themeName"
  />

  <McpMobileDetailPage
    v-if="isMobile && mobileDetailMcp"
    :mcp="mobileDetailMcp"
    @close="mobileDetailMcp = null"
  />

  <McpMainPage
    v-else
    :search-text="searchText"
    :active-tab="activeTab"
    :active-category="activeCategory"
    :active-category-label="activeCategoryLabel"
    :created-only="createdOnly"
    :categories="categories"
    :mcps="mcps"
    :pages="pages"
    :current-page="currentPage"
    :max-page="maxPage"
    @update-search-text="$emit('update-search-text', $event)"
    @search="$emit('search')"
    @update-active-tab="$emit('update-active-tab', $event)"
    @select-category="$emit('select-category', $event)"
    @update-created-only="$emit('update-created-only', $event)"
    @open-category-picker="categorySelectorOpen = true"
    @open-create="$emit('open-create')"
    @open-detail="openDetail"
    @go-page="$emit('go-page', $event)"
  />

  <div
    v-if="selectedMcp && !isMobile"
    class="studio-dialog-backdrop tw-fixed tw-inset-0 tw-z-modal tw-box-border tw-flex tw-items-center tw-justify-center tw-bg-[rgba(15,23,42,0.42)] tw-p-6"
  >
    <article
      ref="detailDialogRef"
      class="studio-dialog tw-relative tw-box-border tw-flex tw-max-h-[calc(100vh-48px)] tw-w-[min(var(--layout-studio-modal-width,760px),calc(100vw-32px))] tw-flex-col tw-overflow-y-auto tw-rounded-dialog tw-bg-studio-surface tw-p-6 tw-text-studio-text tw-shadow-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="t('mcp.detail.title')"
    >
      <button
        class="studio-dialog__close tw-absolute tw-right-3 tw-top-3 tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-text-studio-text"
        type="button"
        :aria-label="t('common.close')"
        @click="closeDetailDialog"
      >
        ×
      </button>
      <McpInfoPanel :mcp="selectedMcp" />
      <footer
        class="studio-dialog__footer tw-mx-[-24px] tw-mb-[-24px] tw-mt-5 tw-flex tw-shrink-0 tw-items-center tw-justify-end tw-gap-2 tw-border-t tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-px-6 tw-py-3.5"
      >
        <button
          class="studio-button studio-button--primary"
          type="button"
          @click="closeDetailDialog"
        >
          {{ t("common.close") }}
        </button>
      </footer>
    </article>
  </div>

  <StudioCategoryPicker
    :open="categorySelectorOpen"
    :categories="categories"
    :selected-value="activeCategory"
    @close="categorySelectorOpen = false"
    @select="selectCategory"
  />
</template>

<script setup>
import {computed, ref, watch, inject} from "vue";
import {useI18n} from "vue-i18n";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import McpMainPage from "@/components/mcp/McpMainPage.vue";
import McpMobileDetailPage from "@/components/mcp/McpMobileDetailPage.vue";
import McpInfoPanel from "@/components/mcp/McpInfoPanel.vue";
import StudioCategoryPicker from "@/components/studio/StudioCategoryPicker.vue";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import {
  createEmptyWorkspaceState,
  CHAT_WORKSPACE_STATE_KEY,
} from "@/composables/chat/chatActionContext";

const {t} = useI18n();
const {shouldUseOverlayScrollbar} = useOverlayScrollPolicy();
const props = defineProps({
  searchText: {type: String, default: ""},
  activeTab: {type: String, default: "all"},
  activeCategory: {type: String, default: "ALL"},
  activeCategoryLabel: {type: String, default: ""},
  createdOnly: {type: Boolean, default: false},
  categories: {type: Array, default: () => []},
  mcps: {type: Array, default: () => []},
  pages: {type: Array, default: () => []},
  currentPage: {type: Number, default: 1},
  maxPage: {type: Number, default: 1},
});
const emit = defineEmits([
  "update-search-text",
  "search",
  "update-active-tab",
  "select-category",
  "update-created-only",
  "open-create",
  "go-page",
]);

const responsiveContext = useResponsiveContext();
const isMobile = computed(() => responsiveContext.value.isMobile);
const injectedWorkspaceState = inject(
  CHAT_WORKSPACE_STATE_KEY,
  computed(createEmptyWorkspaceState)
);
const workspaceState = computed(
  () => injectedWorkspaceState.value || createEmptyWorkspaceState()
);
const selectedMcp = ref(null);
const detailDialogRef = ref(null);
const mobileDetailMcp = ref(null);
const categorySelectorOpen = ref(false);
useOverlayScrollbar(
  detailDialogRef,
  {overflow: {x: "hidden", y: "scroll"}},
  {
    enabled: () => shouldUseOverlayScrollbar.value,
    watchSource: () => [Boolean(selectedMcp.value)],
  }
);

watch(isMobile, (mobile) => {
  if (mobile && selectedMcp.value) {
    mobileDetailMcp.value = selectedMcp.value;
    selectedMcp.value = null;
    return;
  }
  if (!mobile && mobileDetailMcp.value) {
    selectedMcp.value = mobileDetailMcp.value;
    mobileDetailMcp.value = null;
  }
});

watch(
  () => props.activeTab,
  () => {
    if (props.activeTab !== "all") categorySelectorOpen.value = false;
  }
);

function openDetail(mcp) {
  if (isMobile.value) mobileDetailMcp.value = mcp;
  else selectedMcp.value = mcp;
}

function closeDetailDialog() {
  selectedMcp.value = null;
}

function selectCategory(value) {
  categorySelectorOpen.value = false;
  emit("select-category", value);
}
</script>
