<template>
  <section
    ref="createPageRef"
    class="studio-create-fixed-frame flex min-h-0 flex-1 flex-col bg-app-bg text-app-text mobile:relative mobile:inset-auto mobile:z-auto"
    :aria-label="t('studio.createPage.title')"
    @focusin="handleCreateFocusIn"
    @focusout="handleCreateFocusOut"
  >
    <header class="flex min-h-[58px] shrink-0 items-center gap-3 border-b border-app-border bg-app-surface px-[clamp(18px,3vw,32px)] mobile:min-h-[52px] mobile:px-3">
      <button
        v-if="isMobile"
        class="flex h-10 w-10 items-center justify-center rounded-ui text-app-text hover:bg-app-hover"
        type="button"
        :aria-label="t('studio.createPage.back')"
        :title="t('studio.createPage.back')"
        @click="$emit('close')"
      >
        <span class="studio-icon studio-icon--back" aria-hidden="true"></span>
      </button>
      <strong class="min-w-0 flex-1 text-lg font-black mobile:text-base">{{
        t("studio.createPage.title")
      }}</strong>
      <div v-if="!isMobile" class="flex shrink-0 items-center gap-2">
        <button
          class="inline-flex h-10 items-center gap-2 rounded-ui border border-app-border bg-app-surface px-3 text-sm font-extrabold text-app-text hover:bg-app-hover"
          type="button"
          :aria-label="t('studio.createPage.apply')"
          :title="t('studio.createPage.apply')"
          @click="$emit('apply-preview')"
        >
          <span class="studio-icon studio-icon--apply" aria-hidden="true"></span>
          <span>{{ t("studio.createPage.apply") }}</span>
        </button>
        <button
          class="inline-flex h-10 items-center gap-2 rounded-ui border border-app-border bg-app-surface px-3 text-sm font-extrabold text-app-text hover:bg-app-hover"
          type="button"
          :aria-label="t('studio.createPage.save')"
          :title="t('studio.createPage.save')"
        >
          <span class="studio-icon studio-icon--save" aria-hidden="true"></span>
          <span>{{ t("studio.createPage.save") }}</span>
        </button>
        <button
          class="inline-flex h-10 items-center gap-2 rounded-ui border border-app-primary bg-app-primary px-3 text-sm font-extrabold text-white hover:bg-app-primaryStrong"
          type="button"
          :aria-label="t('studio.createPage.register')"
          :title="t('studio.createPage.register')"
        >
          <span class="studio-icon studio-icon--register" aria-hidden="true"></span>
          <span>{{ t("studio.createPage.register") }}</span>
        </button>
        <button
          class="inline-flex h-10 items-center gap-2 rounded-ui border border-app-border bg-app-surface px-3 text-sm font-extrabold text-app-text hover:bg-app-hover"
          type="button"
          :aria-label="t('studio.createPage.close')"
          :title="t('studio.createPage.close')"
          @click="$emit('close')"
        >
          <span class="studio-icon studio-icon--close" aria-hidden="true"></span>
          <span>{{ t("studio.createPage.close") }}</span>
        </button>
      </div>
      <button
        v-else
        class="flex h-10 w-10 items-center justify-center rounded-ui text-app-text hover:bg-app-hover"
        type="button"
        :aria-label="t('studio.createPage.actionMenu')"
        :title="t('studio.createPage.actionMenu')"
        @click="actionSheetOpen = true"
      >
        <span class="studio-icon studio-icon--more" aria-hidden="true"></span>
      </button>
    </header>

    <div class="studio-create-layout grid min-h-0 flex-1 grid-cols-[minmax(420px,0.9fr)_minmax(440px,1.1fr)] gap-4 overflow-hidden p-[16px_clamp(18px,3vw,32px)_18px] mobile:block mobile:overflow-y-auto mobile:p-3">
      <form ref="createFormRef" class="studio-scrollbar-stable flex min-h-0 flex-col overflow-y-auto rounded-ui border border-app-border bg-app-surface mobile:min-h-[auto] mobile:overflow-visible mobile:border-0" @submit.prevent>
        <div
          class="sticky top-0 z-[2] flex shrink-0 gap-1 border-b border-app-border bg-app-surface px-4 pt-3 mobile:static mobile:mb-3 mobile:rounded-ui mobile:border mobile:p-1"
          role="tablist"
          :aria-label="t('studio.createPage.settingsLabel')"
        >
          <button
            type="button"
            class="rounded-t-ui px-4 py-3 text-sm font-extrabold text-app-subtle mobile:flex-1 mobile:rounded-ui mobile:py-2"
            :class="createTab === 'basic' ? 'text-app-text shadow-[inset_0_-2px_0_var(--primary,#10a37f)] mobile:bg-app-surface mobile:shadow-sm' : ''"
            @click="$emit('update-create-tab', 'basic')"
          >
            {{ t("studio.createPage.basic") }}
          </button>
          <button
            type="button"
            class="rounded-t-ui px-4 py-3 text-sm font-extrabold text-app-subtle mobile:flex-1 mobile:rounded-ui mobile:py-2"
            :class="createTab === 'feature' ? 'text-app-text shadow-[inset_0_-2px_0_var(--primary,#10a37f)] mobile:bg-app-surface mobile:shadow-sm' : ''"
            @click="$emit('update-create-tab', 'feature')"
          >
            {{ t("studio.createPage.feature") }}
          </button>
          <button
            type="button"
            class="rounded-t-ui px-4 py-3 text-sm font-extrabold text-app-subtle mobile:flex-1 mobile:rounded-ui mobile:py-2"
            :class="createTab === 'share' ? 'text-app-text shadow-[inset_0_-2px_0_var(--primary,#10a37f)] mobile:bg-app-surface mobile:shadow-sm' : ''"
            @click="$emit('update-create-tab', 'share')"
          >
            {{ t("studio.createPage.share") }}
          </button>
        </div>

        <div class="min-h-0 flex-1 p-4 mobile:p-0">
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
        </div>
      </form>

      <StudioPreview
        :initial="previewInitial"
        :name="preview.name"
        :description="preview.description"
        :prompts="previewPrompts"
      />
    </div>

    <BaseBottomSheet
      v-if="isMobile"
      :open="actionSheetOpen"
      :title="t('studio.createPage.actionMenu')"
      overlay-class="studio-create-action-bottom-sheet"
      initial-snap="content"
      :min-height="300"
      :max-ratio="0.75"
      @close="actionSheetOpen = false"
    >
      <div class="flex flex-col gap-2 p-1">
        <button class="flex min-h-[48px] w-full items-center gap-3 rounded-ui px-3 text-left font-extrabold text-app-text hover:bg-app-hover" type="button" @click="handleMobileApply">
          <span class="studio-icon studio-icon--apply" aria-hidden="true"></span>
          <strong>{{ t("studio.createPage.apply") }}</strong>
        </button>
        <button class="flex min-h-[48px] w-full items-center gap-3 rounded-ui px-3 text-left font-extrabold text-app-text hover:bg-app-hover" type="button" @click="actionSheetOpen = false">
          <span class="studio-icon studio-icon--save" aria-hidden="true"></span>
          <strong>{{ t("studio.createPage.save") }}</strong>
        </button>
        <button class="flex min-h-[48px] w-full items-center gap-3 rounded-ui px-3 text-left font-extrabold text-app-text hover:bg-app-hover" type="button" @click="actionSheetOpen = false">
          <span class="studio-icon studio-icon--register" aria-hidden="true"></span>
          <strong>{{ t("studio.createPage.register") }}</strong>
        </button>
        <button class="flex min-h-[48px] w-full items-center gap-3 rounded-ui px-3 text-left font-extrabold text-app-text hover:bg-app-hover" type="button" @click="handleMobileClose">
          <span class="studio-icon studio-icon--close" aria-hidden="true"></span>
          <strong>{{ t("studio.createPage.close") }}</strong>
        </button>
      </div>
    </BaseBottomSheet>
  </section>
</template>

<script setup>
import StudioBasicInfoTab from "@/components/studio/StudioBasicInfoTab.vue";
import StudioFeatureTab from "@/components/studio/StudioFeatureTab.vue";
import StudioShareScopeTab from "@/components/studio/StudioShareScopeTab.vue";
import {computed, nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import StudioPreview from "@/components/studio/StudioPreview.vue";

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
const responsiveContext = useResponsiveContext();
const isMobile = computed(() => responsiveContext.value.isMobile);

const createPageRef = ref(null);
const createFormRef = ref(null);
const focusedEditor = ref(null);
const actionSheetOpen = ref(false);
useOverlayScrollbar(createFormRef, {overflow: {x: "hidden", y: "scroll"}});

let focusScrollTimer = 0;
let repeatedFocusTimers = [];

function isEditableField(element) {
  return Boolean(
    element instanceof HTMLElement &&
    ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)
  );
}

function clearFocusScrollTimers() {
  window.clearTimeout(focusScrollTimer);
  focusScrollTimer = 0;
  repeatedFocusTimers.forEach((timer) => window.clearTimeout(timer));
  repeatedFocusTimers = [];
}

function getVisibleViewportBounds(scroller) {
  const visualViewport = window.visualViewport;
  const scrollerRect = scroller.getBoundingClientRect();
  const viewportTop = Math.max(
    scrollerRect.top,
    Math.round(visualViewport?.offsetTop || 0)
  );
  const viewportBottom = Math.min(
    scrollerRect.bottom,
    Math.round(
      (visualViewport?.offsetTop || 0) +
        (visualViewport?.height || window.innerHeight || scrollerRect.bottom)
    )
  );

  return {
    top: viewportTop + 14,
    bottom: viewportBottom - 24,
  };
}

function ensureFocusedEditorVisible(behavior = "smooth") {
  if (!isMobile.value) {
    return;
  }
  const target = focusedEditor.value;
  const scroller = createPageRef.value?.querySelector?.(
    ".studio-create-layout"
  );
  if (!target || !scroller) {
    return;
  }
  const field = target.closest?.("label, fieldset") || target;
  if (!(field instanceof HTMLElement)) {
    return;
  }

  const bounds = getVisibleViewportBounds(scroller);
  const fieldRect = field.getBoundingClientRect();
  const fieldHeight = Math.max(fieldRect.height, 44);
  const visibleHeight = Math.max(bounds.bottom - bounds.top, 120);
  const targetTop =
    bounds.top + Math.max(12, (visibleHeight - fieldHeight) * 0.42);

  let delta = 0;
  if (fieldRect.bottom > bounds.bottom) {
    delta = fieldRect.bottom - bounds.bottom;
  }
  if (fieldRect.top < bounds.top) {
    delta = fieldRect.top - bounds.top;
  }

  if (Math.abs(delta) < 4 && fieldRect.top > targetTop + 24) {
    delta = fieldRect.top - targetTop;
  }

  if (Math.abs(delta) > 3) {
    scroller.scrollBy({top: delta, left: 0, behavior});
  }
}

function scheduleFocusedEditorVisible() {
  clearFocusScrollTimers();
  const delays = [80, 180, 340, 560];
  repeatedFocusTimers = delays.map((delay, index) =>
    window.setTimeout(() => {
      ensureFocusedEditorVisible(index === 0 ? "auto" : "smooth");
    }, delay)
  );
}

function handleCreateFocusIn(event) {
  const target = event.target;
  if (!isMobile.value || !isEditableField(target)) {
    return;
  }
  focusedEditor.value = target;
  nextTick(scheduleFocusedEditorVisible);
}

function handleCreateFocusOut(event) {
  const target = event.target;
  if (target === focusedEditor.value) {
    focusedEditor.value = null;
    clearFocusScrollTimers();
  }
}

onMounted(() => {
  window.visualViewport?.addEventListener(
    "resize",
    scheduleFocusedEditorVisible,
    {
      passive: true,
    }
  );
  window.visualViewport?.addEventListener(
    "scroll",
    scheduleFocusedEditorVisible,
    {
      passive: true,
    }
  );
});

onBeforeUnmount(() => {
  clearFocusScrollTimers();
  window.visualViewport?.removeEventListener(
    "resize",
    scheduleFocusedEditorVisible
  );
  window.visualViewport?.removeEventListener(
    "scroll",
    scheduleFocusedEditorVisible
  );
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
