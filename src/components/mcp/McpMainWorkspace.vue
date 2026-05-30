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

  <div v-if="selectedMcp && !isMobile" class="studio-dialog-backdrop">
    <article
      ref="detailDialogRef"
      class="studio-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="t('mcp.detail.title')"
    >
      <button
        class="studio-dialog__close"
        type="button"
        :aria-label="t('common.close')"
        @click="closeDetailDialog"
      >
        ×
      </button>
      <McpDetailContent :mcp="selectedMcp" />
      <footer class="studio-dialog__footer">
        <button class="studio-button studio-button--primary" type="button" @click="closeDetailDialog">
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
import {computed, inject, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import McpMainPage from "@/components/mcp/McpMainPage.vue";
import McpMobileDetailPage from "@/components/mcp/McpMobileDetailPage.vue";
import McpDetailContent from "@/components/mcp/McpDetailContent.vue";
import StudioCategoryPicker from "@/components/studio/StudioCategoryPicker.vue";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import {
  CHAT_WORKSPACE_STATE_KEY,
  createEmptyWorkspaceState,
} from "@/composables/chat/chatActionContext";

const {t} = useI18n();
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
useOverlayScrollbar(detailDialogRef, {overflow: {x: "hidden", y: "scroll"}}, {watchSource: () => [Boolean(selectedMcp.value)]});

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
