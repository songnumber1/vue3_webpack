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
    @edit="handleEditStudio"
    @delete="requestDeleteStudio"
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
    class="studio-dialog-backdrop tw-fixed tw-inset-0 tw-z-modal tw-box-border tw-flex tw-items-center tw-justify-center tw-bg-[rgba(15,23,42,0.42)] tw-p-6"
  >
    <article
      ref="detailDialogRef"
      class="studio-dialog tw-relative tw-box-border tw-flex tw-max-h-[calc(100vh-48px)] tw-w-[min(760px,calc(100vw-32px))] tw-flex-col tw-overflow-y-auto tw-rounded-dialog tw-bg-studio-surface tw-p-6 tw-text-studio-text tw-shadow-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="t('studio.detail.title')"
    >
      <button
        v-if="selectedStudio.isMine"
        ref="detailSettingsButtonRef"
        class="studio-dialog__settings"
        type="button"
        :aria-label="t('studio.detail.settings')"
        :title="t('studio.detail.settings')"
        @click.stop="detailActionMenuOpen = !detailActionMenuOpen"
      >
        <span class="studio-icon studio-icon--settings" aria-hidden="true"></span>
      </button>
      <button
        class="studio-dialog__close tw-absolute tw-right-3 tw-top-3 tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-text-studio-text"
        type="button"
        :aria-label="t('common.close')"
        @click="closeDetailDialog"
      >
        ×
      </button>
      <StudioDetailContent :studio="selectedStudio" />
      <footer class="studio-dialog__footer tw-mx-[-24px] tw-mb-[-24px] tw-mt-5 tw-flex tw-shrink-0 tw-items-center tw-justify-end tw-gap-2 tw-border-t tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-px-6 tw-py-3.5">
        <button class="studio-button studio-button--primary" type="button" @click="closeDetailDialog">
          {{ t("common.close") }}
        </button>
      </footer>
    </article>
  </div>

  <teleport to="body">
    <div
      v-if="detailActionMenuOpen && selectedStudio && !isMobile"
      ref="detailActionMenuRef"
      class="studio-detail-context-menu-shell"
      :style="detailActionMenuStyle"
    >
      <div class="studio-detail-context-menu" role="menu">
        <button type="button" role="menuitem" @click="handleEditStudio(selectedStudio)">
          <span aria-hidden="true">✎</span>
          <span>{{ t('studio.detail.edit') }}</span>
        </button>
        <button class="studio-detail-context-menu__danger" type="button" role="menuitem" @click="requestDeleteStudio(selectedStudio)">
          <span aria-hidden="true">🗑</span>
          <span>{{ t('studio.detail.delete') }}</span>
        </button>
      </div>
    </div>
  </teleport>

  <div v-if="deleteTarget" class="studio-confirm-backdrop tw-fixed tw-inset-0 tw-z-modal">
    <article class="studio-confirm-dialog tw-bg-studio-surface tw-text-studio-text" role="dialog" aria-modal="true" :aria-label="t('studio.detail.deleteConfirmTitle')">
      <header class="studio-confirm-dialog__head">
        <strong>{{ t('studio.detail.deleteConfirmTitle') }}</strong>
        <button type="button" :aria-label="t('common.close')" @click="deleteTarget = null">×</button>
      </header>
      <p>{{ t('studio.detail.deleteConfirmMessage') }}</p>
      <footer class="studio-confirm-dialog__footer">
        <button class="studio-button" type="button" @click="deleteTarget = null">{{ t('common.close') }}</button>
        <button class="studio-button studio-button--danger" type="button" @click="confirmDeleteStudio">{{ t('studio.detail.deleteConfirmAction') }}</button>
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
import {computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {autoUpdate, flip, offset, shift, useFloating} from "@floating-ui/vue";
import ChatHeader from "@/components/chat/ChatHeader.vue";
import StudioMainPage from "@/components/studio/StudioMainPage.vue";
import StudioMobileDetailPage from "@/components/studio/StudioMobileDetailPage.vue";
import StudioDetailContent from "@/components/studio/StudioDetailContent.vue";
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
const detailDialogRef = ref(null);
const mobileDetailStudio = ref(null);
const categorySelectorOpen = ref(false);
const detailActionMenuOpen = ref(false);
const detailSettingsButtonRef = ref(null);
const detailActionMenuRef = ref(null);
const deleteTarget = ref(null);
useOverlayScrollbar(detailDialogRef, {overflow: {x: "hidden", y: "scroll"}}, {watchSource: () => [Boolean(selectedStudio.value)]});

const {floatingStyles, update: updateDetailMenu, x, y} = useFloating(
  detailSettingsButtonRef,
  detailActionMenuRef,
  {
    placement: "bottom-end",
    strategy: "fixed",
    transform: false,
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip({fallbackPlacements: ["bottom-start", "top-end"]}), shift({padding: 12})],
  }
);

const detailActionMenuStyle = computed(() => ({
  ...floatingStyles.value,
  position: "fixed",
  visibility: Number.isFinite(x.value) && Number.isFinite(y.value) ? "visible" : "hidden",
}));

watch(isMobile, (mobile) => {
  detailActionMenuOpen.value = false;
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

watch(detailActionMenuOpen, async (open) => {
  if (!open) return;
  await nextTick();
  await updateDetailMenu?.();
});

function handleGlobalPointerDown(event) {
  if (!detailActionMenuOpen.value) return;
  const target = event.target;
  if (detailActionMenuRef.value?.contains?.(target)) return;
  if (detailSettingsButtonRef.value?.contains?.(target)) return;
  detailActionMenuOpen.value = false;
}

onMounted(() => {
  document.addEventListener("pointerdown", handleGlobalPointerDown, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleGlobalPointerDown, true);
});

function openDetail(studio) {
  detailActionMenuOpen.value = false;
  if (isMobile.value) mobileDetailStudio.value = studio;
  else selectedStudio.value = studio;
}

function closeDetailDialog() {
  detailActionMenuOpen.value = false;
  selectedStudio.value = null;
}

function handleEditStudio(studio) {
  detailActionMenuOpen.value = false;
  selectedStudio.value = null;
  mobileDetailStudio.value = null;
  emit("edit-studio", studio);
}

function requestDeleteStudio(studio) {
  detailActionMenuOpen.value = false;
  deleteTarget.value = studio;
}

function confirmDeleteStudio() {
  if (!deleteTarget.value) return;
  const target = deleteTarget.value;
  deleteTarget.value = null;
  selectedStudio.value = null;
  mobileDetailStudio.value = null;
  emit("delete-studio", target);
}

function selectCategory(value) {
  emit("select-category", value);
  categorySelectorOpen.value = false;
}
</script>
