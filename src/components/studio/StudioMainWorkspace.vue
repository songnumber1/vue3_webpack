<template>
  <ChatHeader
    v-if="isMobile && !detailOpen"
    mode="studio"
    :assistant-label="workspaceState.assistantLabel"
    :assistant="workspaceState.assistant"
    conversation-title="Assistant Studio"
    :theme-name="workspaceState.themeName"
  />

  <StudioMainPage
    v-show="!detailOpen"
    :search-text="searchText"
    :active-tab="activeTab"
    :active-category="activeCategory"
    :active-category-label="activeCategoryLabel"
    :categories="categories"
    :studios="studios"
    :pages="pages"
    :current-page="currentPage"
    :max-page="maxPage"
    @update-search-text="$emit('update-search-text', $event)"
    @search="$emit('search')"
    @update-active-tab="$emit('update-active-tab', $event)"
    @select-category="$emit('select-category', $event)"
    @open-category-picker="categorySelectorOpen = true"
    @open-create="$emit('open-create')"
    @open-detail="openDetail"
    @go-page="$emit('go-page', $event)"
  />

  <StudioDetailViewer
    :open="detailOpen"
    :studio="selectedStudio"
    :is-mobile="isMobile"
    :allow-actions="true"
    @close="closeDetailDialog"
    @edit="handleEditStudio"
    @delete="confirmDeleteStudio"
  />

  <StudioCategoryPicker
    :open="categorySelectorOpen && !detailOpen"
    :categories="categories"
    :selected-value="activeCategory"
    @close="categorySelectorOpen = false"
    @select="selectCategory"
  />
</template>

<script setup>
import {computed, ref, watch, inject} from "vue";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import StudioMainPage from "@/components/studio/StudioMainPage.vue";
import StudioDetailViewer from "@/components/studio/StudioDetailViewer.vue";
import StudioCategoryPicker from "@/components/studio/StudioCategoryPicker.vue";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
import {
  createEmptyWorkspaceState,
  CHAT_WORKSPACE_STATE_KEY,
} from "@/composables/chat/chatActionContext";
import {normalizeStudioDetail} from "@/composables/studio/useStudioDetailModel";

const props = defineProps({
  searchText: {type: String, default: ""},
  activeTab: {type: String, default: "all"},
  activeCategory: {type: String, default: "ALL"},
  activeCategoryLabel: {type: String, default: ""},
  categories: {type: Array, default: () => []},
  studios: {type: Array, default: () => []},
  pages: {type: Array, default: () => []},
  currentPage: {type: Number, default: 1},
  maxPage: {type: Number, default: 1},
});
const emit = defineEmits([
  "update-search-text",
  "search",
  "update-active-tab",
  "select-category",
  "open-create",
  "edit-studio",
  "delete-studio",
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
const selectedStudio = ref(null);
const categorySelectorOpen = ref(false);
const detailOpen = computed(() => Boolean(selectedStudio.value));

watch(
  () => props.activeTab,
  () => {
    if (props.activeTab !== "all") categorySelectorOpen.value = false;
  }
);

function openDetail(studio) {
  selectedStudio.value = normalizeStudioDetail(studio);
}

function closeDetailDialog() {
  selectedStudio.value = null;
}

function handleEditStudio(studio) {
  selectedStudio.value = null;
  emit("edit-studio", studio);
}

function confirmDeleteStudio(studio) {
  selectedStudio.value = null;
  emit("delete-studio", studio);
}

function selectCategory(value) {
  emit("select-category", value);
  categorySelectorOpen.value = false;
}
</script>
