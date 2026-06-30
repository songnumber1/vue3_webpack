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
        @click="createForm.closeCreate?.()"
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
            @click="createForm.updateCreateTab?.('basic')"
          >
            {{ t("studio.createPage.basic") }}
          </button>
          <button
            type="button"
            :class="{active: createTab === 'feature'}"
            @click="createForm.updateCreateTab?.('feature')"
          >
            {{ t("studio.createPage.feature") }}
          </button>
          <button
            type="button"
            :class="{active: createTab === 'share'}"
            @click="createForm.updateCreateTab?.('share')"
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
          <StudioBasicInfoTab v-if="createTab === 'basic'" />
          <StudioFeatureTab v-else-if="createTab === 'feature'" />
          <StudioShareScopeTab v-else />
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
import {useStudioCreateForm} from "@/composables/studio/context/studioCreateFormContext";

const {t} = useI18n();
const createForm = useStudioCreateForm();
const createTab = createForm.createTab;
const preview = createForm.preview;
const previewInitial = createForm.previewInitial;
const previewPrompts = createForm.previewPrompts;

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

function handleMobileApply() {
  actionSheetOpen.value = false;
  createForm.applyPreview?.();
}
function handleMobileClose() {
  actionSheetOpen.value = false;
  createForm.closeCreate?.();
}
</script>
