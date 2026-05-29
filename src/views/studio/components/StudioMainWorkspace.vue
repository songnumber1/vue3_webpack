<template>
  <ChatHeader
    v-if="isMobile && !mobileDetailStudio"
    mode="studio"
    :is-mobile="isMobile"
    :assistant-label="workspaceState.assistantLabel"
    :assistant="workspaceState.assistant"
    conversation-title="Assistant Studio"
    :theme-name="workspaceState.themeName"
  />

  <StudioMobileDetailPage
    v-if="isMobile && mobileDetailStudio"
    :studio="mobileDetailStudio"
    @close="mobileDetailStudio = null"
  />

  <StudioMainPage
    v-else
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

  <div v-if="selectedStudio && !isMobile" class="studio-dialog-backdrop" @click.self="selectedStudio = null">
    <article class="studio-dialog" role="dialog" aria-modal="true" aria-label="Assistant Studio 상세">
      <button class="studio-dialog__close" type="button" aria-label="닫기" @click="selectedStudio = null">×</button>
      <StudioDetailContent :studio="selectedStudio" />
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
import ChatHeader from "@/components/chat/ChatHeader.vue";
import StudioMainPage from "@/views/studio/components/StudioMainPage.vue";
import StudioMobileDetailPage from "@/views/studio/components/StudioMobileDetailPage.vue";
import StudioDetailContent from "@/views/studio/components/StudioDetailContent.vue";
import StudioCategoryPicker from "@/views/studio/components/StudioCategoryPicker.vue";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
import {
  CHAT_WORKSPACE_STATE_KEY,
  createEmptyWorkspaceState,
} from "@/composables/chat/chatActionContext";

const props = defineProps({
  searchText: {type: String, default: ""},
  activeTab: {type: String, default: "all"},
  activeCategory: {type: String, default: "ALL"},
  activeCategoryLabel: {type: String, default: "전체"},
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
  "go-page",
]);

const responsiveContext = useResponsiveContext();
const isMobile = computed(() => responsiveContext.value.isMobile);
const injectedWorkspaceState = inject(
  CHAT_WORKSPACE_STATE_KEY,
  computed(createEmptyWorkspaceState)
);
const workspaceState = computed(() => injectedWorkspaceState.value || createEmptyWorkspaceState());
const selectedStudio = ref(null);
const mobileDetailStudio = ref(null);
const categorySelectorOpen = ref(false);

watch(isMobile, (mobile) => {
  if (mobile && selectedStudio.value) {
    mobileDetailStudio.value = selectedStudio.value;
    selectedStudio.value = null;
    return;
  }

  if (!mobile && mobileDetailStudio.value) {
    selectedStudio.value = mobileDetailStudio.value;
    mobileDetailStudio.value = null;
  }
});

watch(
  () => props.activeTab,
  () => {
    if (props.activeTab !== "all") categorySelectorOpen.value = false;
  }
);

function openDetail(studio) {
  if (isMobile.value) mobileDetailStudio.value = studio;
  else selectedStudio.value = studio;
}

function selectCategory(value) {
  emit("select-category", value);
  categorySelectorOpen.value = false;
}
</script>
