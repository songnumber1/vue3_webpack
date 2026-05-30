<template>
  <ChatHeader
    v-if="isMobile && !mobileDetailStudio"
    mode="studio"
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

  <div
    v-if="selectedStudio && !isMobile"
    class="studio-dialog-backdrop"
  >
    <article
      class="studio-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="t('studio.detail.title')"
    >
      <button
        class="studio-dialog__close"
        type="button"
        :aria-label="t('common.close')"
        @click="selectedStudio = null"
      >
        ×
      </button>
      <StudioDetailContent :studio="selectedStudio" />
      <footer class="studio-dialog__footer">
        <button class="studio-button studio-button--primary" type="button" @click="selectedStudio = null">
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
import StudioMainPage from "@/components/studio/StudioMainPage.vue";
import StudioMobileDetailPage from "@/components/studio/StudioMobileDetailPage.vue";
import StudioDetailContent from "@/components/studio/StudioDetailContent.vue";
import StudioCategoryPicker from "@/components/studio/StudioCategoryPicker.vue";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
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
const workspaceState = computed(
  () => injectedWorkspaceState.value || createEmptyWorkspaceState()
);
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
