<template>
  <section
    ref="createPageRef"
    :class="createPageClass"
    :aria-label="t('studio.createPage.title')"
  >
    <header :class="createHeaderClass">
      <button
        class="studio-create-panel__back studio-create-icon-button tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center"
        type="button"
        :aria-label="t('studio.createPage.back')"
        :title="t('studio.createPage.back')"
        @click="$emit('close')"
      >
        <span class="studio-icon studio-icon--back" aria-hidden="true"></span>
      </button>
      <strong
        class="studio-create-panel__title tw-min-w-0 tw-truncate tw-text-lg tw-font-black"
        >{{ t("studio.createPage.title") }}</strong
      >
      <button
        class="studio-create-panel__menu studio-create-icon-button tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center"
        type="button"
        :aria-label="t('studio.createPage.actionMenu')"
        :title="t('studio.createPage.actionMenu')"
        @click="actionSheetOpen = true"
      >
        <span class="studio-icon studio-icon--more" aria-hidden="true"></span>
      </button>
    </header>

    <div ref="createLayoutRef" :class="createLayoutClass">
      <form ref="createFormRef" :class="createFormClass" @submit.prevent>
        <div
          :class="createTabsClass"
          role="tablist"
          :aria-label="t('studio.createPage.settingsLabel')"
        >
          <button
            type="button"
            :class="{active: createTab === 'basic'}"
            @click="$emit('update-create-tab', 'basic')"
          >
            {{ t("studio.createPage.basic") }}
          </button>
          <button
            type="button"
            :class="{active: createTab === 'feature'}"
            @click="$emit('update-create-tab', 'feature')"
          >
            {{ t("studio.createPage.feature") }}
          </button>
          <button
            type="button"
            :class="{active: createTab === 'share'}"
            @click="$emit('update-create-tab', 'share')"
          >
            {{ t("studio.createPage.share") }}
          </button>
        </div>

        <OverlayScrollContainer
          ref="createContentRef"
          class="studio-create-content tw-min-h-0 tw-min-w-0 tw-flex-1 tw-overflow-y-auto"
          area="studio-create"
          keyboard-aware
          :overlay-options="studioCreateOverlayOptions"
          :keyboard-options="studioCreateKeyboardOptions"
        >
          <StudioBasicInfoTab
            v-if="createTab === 'basic'"
            :draft="draft"
            :selected-category-label="selectedCategoryLabel"
            :category-options="categoryOptions"
            @update-field="handleDraftField"
            @update-prompt="handleDraftPrompt"
            @open-category="$emit('open-category')"
          />
          <StudioFeatureTab
            v-else-if="createTab === 'feature'"
            :model-options="modelOptions"
            :selected-models="draft.models"
            :selected-rags="draft.rags"
            :selected-mcps="draft.mcps"
            :rag-options="ragOptions"
            :mcp-options="mcpOptions"
            @toggle-model="$emit('toggle-model', $event)"
            @update-rags="$emit('update-rags', $event)"
            @update-mcps="$emit('update-mcps', $event)"
          />
          <StudioShareScopeTab
            v-else
            :scope="draft.scope"
            :authorities="selectedAuthorities"
            :all-authorities-checked="allAuthoritiesChecked"
            @update-scope="$emit('update-scope', $event)"
            @open-authority-picker="$emit('open-authority-picker')"
            @delete-checked-authorities="$emit('delete-checked-authorities')"
            @toggle-all-authorities="$emit('toggle-all-authorities', $event)"
            @toggle-authority="handleAuthorityToggle"
          />
        </OverlayScrollContainer>
      </form>

      <StudioPreview
        :initial="previewInitial"
        :name="preview.name"
        :description="preview.description"
        :prompts="previewPrompts"
      />
    </div>

    <StudioCreateActionBottomSheet
      :open="actionSheetOpen"
      @close="actionSheetOpen = false"
      @apply="handleMobileApply"
      @request-close="handleMobileClose"
    />
  </section>
</template>

<script setup>
import OverlayScrollContainer from "@/components/common/OverlayScrollContainer.vue";
import StudioBasicInfoTab from "@/components/studio/StudioBasicInfoTab.vue";
import StudioFeatureTab from "@/components/studio/StudioFeatureTab.vue";
import StudioShareScopeTab from "@/components/studio/StudioShareScopeTab.vue";
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import StudioPreview from "@/components/studio/StudioPreview.vue";
import StudioCreateActionBottomSheet from "@/components/studio/create/StudioCreateActionBottomSheet.vue";

const {t} = useI18n();

defineProps({
  createTab: {type: String, default: "basic"},
  draft: {type: Object, required: true},
  preview: {type: Object, required: true},
  previewInitial: {type: String, default: "A"},
  previewPrompts: {type: Array, default: () => []},
  selectedCategoryLabel: {type: String, default: ""},
  categoryOptions: {type: Array, default: () => []},
  modelOptions: {type: Array, default: () => []},
  ragOptions: {type: Array, default: () => []},
  mcpOptions: {type: Array, default: () => []},
  selectedAuthorities: {type: Array, default: () => []},
  allAuthoritiesChecked: {type: Boolean, default: false},
});

const createPageRef = ref(null);
const createFormRef = ref(null);
const createLayoutRef = ref(null);
const createContentRef = ref(null);
const actionSheetOpen = ref(false);

const createPageClass = computed(() => [
  "studio-create-page tw-min-h-0 tw-bg-studio-bg tw-text-studio-text tw-flex tw-flex-col",
  "tw-flex-1 tw-h-full tw-overflow-hidden",
]);

const createHeaderClass = computed(() => [
  "studio-create-panel__head tw-flex tw-shrink-0 tw-items-center tw-justify-between tw-gap-3 tw-border-b tw-border-solid tw-border-studio-border tw-bg-studio-surface",
  "tw-min-h-[calc(52px+env(safe-area-inset-top,0px))] tw-px-2 tw-pt-[env(safe-area-inset-top,0px)] tw-pb-0",
]);

const createLayoutClass = computed(() => [
  "studio-create-layout tw-flex-1 tw-min-h-0",
  "tw-block tw-overflow-hidden tw-p-3",
]);

const createFormClass = computed(() => [
  // Keep the panel border/padding/radius owned by Studio SCSS.
  // Tailwind shell classes here should only provide sizing/scroll behavior;
  // adding tw-border/tw-rounded/tw-p-* duplicates the legacy tab panel border,
  // making the create tabs look thicker on legacy layouts.
  "studio-create-form tw-min-h-0 tw-bg-studio-surface",
  "tw-flex tw-h-full tw-w-full tw-flex-col tw-overflow-hidden",
]);

const createTabsClass = computed(() => [
  // The tab header has mobile-specific SCSS guards for border, spacing,
  // sticky offsets and active underline. Avoid Tailwind border/negative-margin
  // utilities here so the before_front tab header remains visually identical.
  "studio-create-tabs tw-shrink-0 tw-overflow-x-auto tw-bg-studio-surface",
]);
const studioCreateOverlayOptions = Object.freeze({
  overflow: {x: "hidden", y: "scroll"},
});

const studioCreateKeyboardOptions = Object.freeze({
  restoreDocumentScroll: true,
  textareaTopSentinel: true,
  textareaTopScrollSentinel: 12,
  fieldSelector: "label, fieldset",
  delays: [0, 40, 90, 160, 260, 420, 620],
  edgePaddingTop: 14,
  edgePaddingBottom: 28,
});

const emit = defineEmits([
  "close",
  "apply-preview",
  "update-create-tab",
  "update-draft-field",
  "update-draft-prompt",
  "open-category",
  "toggle-model",
  "update-rags",
  "update-mcps",
  "update-scope",
  "open-authority-picker",
  "delete-checked-authorities",
  "toggle-all-authorities",
  "toggle-authority",
]);

function handleDraftField(field, value) {
  emit("update-draft-field", field, value);
}
function handleDraftPrompt(index, value) {
  emit("update-draft-prompt", index, value);
}
function handleAuthorityToggle(deptId, checked) {
  emit("toggle-authority", deptId, checked);
}
function handleMobileApply() {
  actionSheetOpen.value = false;
  emit("apply-preview");
}
function handleMobileClose() {
  actionSheetOpen.value = false;
  emit("close");
}
</script>
