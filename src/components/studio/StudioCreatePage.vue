<template>
  <section
    ref="createPageRef"
    :class="createPageClass"
    :aria-label="t('studio.createPage.title')"
    @pointerdown.capture="handleCreatePointerDown"
    @touchstart.capture="handleCreatePointerDown"
    @focusin="handleCreateFocusIn"
    @focusout="handleCreateFocusOut"
  >
    <header :class="createHeaderClass">
      <button
        v-if="isMobile"
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
      <div
        v-if="!isMobile"
        class="studio-create-actions tw-flex tw-shrink-0 tw-items-center tw-justify-end tw-gap-2 tw-flex-wrap"
      >
        <button
          class="studio-button studio-create-action-button tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center"
          type="button"
          :aria-label="t('studio.createPage.apply')"
          :title="t('studio.createPage.apply')"
          @click="$emit('apply-preview')"
        >
          <span
            class="studio-icon studio-icon--apply"
            aria-hidden="true"
          ></span>
          <span>{{ t("studio.createPage.apply") }}</span>
        </button>
        <button
          class="studio-button studio-create-action-button"
          type="button"
          :aria-label="t('studio.createPage.save')"
          :title="t('studio.createPage.save')"
        >
          <span class="studio-icon studio-icon--save" aria-hidden="true"></span>
          <span>{{ t("studio.createPage.save") }}</span>
        </button>
        <button
          class="studio-button studio-button--primary studio-create-action-button tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center"
          type="button"
          :aria-label="t('studio.createPage.register')"
          :title="t('studio.createPage.register')"
        >
          <span
            class="studio-icon studio-icon--register"
            aria-hidden="true"
          ></span>
          <span>{{ t("studio.createPage.register") }}</span>
        </button>
        <button
          class="studio-button studio-create-action-button"
          type="button"
          :aria-label="t('studio.createPage.close')"
          :title="t('studio.createPage.close')"
          @click="$emit('close')"
        >
          <span
            class="studio-icon studio-icon--close"
            aria-hidden="true"
          ></span>
          <span>{{ t("studio.createPage.close") }}</span>
        </button>
      </div>
      <button
        v-else
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

        <div
          ref="createContentRef"
          class="studio-create-content tw-min-h-0 tw-min-w-0 tw-flex-1 tw-overflow-y-auto"
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
      <div class="studio-create-action-sheet__list">
        <button
          class="bottom-sheet-option bottom-sheet-option--row studio-create-action-sheet__option"
          type="button"
          @click="handleMobileApply"
        >
          <span
            class="studio-icon studio-icon--apply"
            aria-hidden="true"
          ></span>
          <strong>{{ t("studio.createPage.apply") }}</strong>
        </button>
        <button
          class="bottom-sheet-option bottom-sheet-option--row studio-create-action-sheet__option"
          type="button"
          @click="actionSheetOpen = false"
        >
          <span class="studio-icon studio-icon--save" aria-hidden="true"></span>
          <strong>{{ t("studio.createPage.save") }}</strong>
        </button>
        <button
          class="bottom-sheet-option bottom-sheet-option--row studio-create-action-sheet__option"
          type="button"
          @click="actionSheetOpen = false"
        >
          <span
            class="studio-icon studio-icon--register"
            aria-hidden="true"
          ></span>
          <strong>{{ t("studio.createPage.register") }}</strong>
        </button>
        <button
          class="bottom-sheet-option bottom-sheet-option--row studio-create-action-sheet__option"
          type="button"
          @click="handleMobileClose"
        >
          <span
            class="studio-icon studio-icon--close"
            aria-hidden="true"
          ></span>
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
import {computed, onBeforeUnmount, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import {useKeyboardFocusGuard} from "@/composables/viewport/useKeyboardFocusGuard";
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
const createLayoutRef = ref(null);
const createContentRef = ref(null);
const actionSheetOpen = ref(false);

const createPageClass = computed(() => [
  "studio-create-page tw-min-h-0 tw-bg-studio-bg tw-text-studio-text tw-flex tw-flex-col",
  isMobile.value
    ? "tw-flex-1 tw-h-full tw-overflow-hidden"
    : "tw-fixed tw-left-0 tw-right-0 tw-top-appHeader tw-bottom-appFooter tw-z-stickyControl",
]);

const createHeaderClass = computed(() => [
  "studio-create-panel__head tw-flex tw-shrink-0 tw-items-center tw-justify-between tw-gap-3 tw-border-b tw-border-solid tw-border-studio-border tw-bg-studio-surface",
  isMobile.value
    ? "tw-min-h-[calc(52px+env(safe-area-inset-top,0px))] tw-px-2 tw-pt-[env(safe-area-inset-top,0px)] tw-pb-0"
    : "tw-min-h-[58px] tw-px-[clamp(18px,3vw,32px)] tw-py-0",
]);

const createLayoutClass = computed(() => [
  "studio-create-layout tw-flex-1 tw-min-h-0",
  isMobile.value
    ? "tw-block tw-overflow-hidden tw-p-3"
    : "tw-grid tw-grid-cols-[minmax(480px,0.95fr)_minmax(420px,0.85fr)] tw-items-stretch tw-gap-4 tw-overflow-hidden tw-px-[clamp(18px,3vw,32px)] tw-pt-4 tw-pb-[18px]",
]);

const createFormClass = computed(() => [
  // Keep the panel border/padding/radius owned by Studio SCSS.
  // Tailwind shell classes here should only provide sizing/scroll behavior;
  // adding tw-border/tw-rounded/tw-p-* duplicates the legacy tab panel border,
  // making the create tabs look thicker on desktop and boxed on mobile.
  "studio-create-form tw-min-h-0 tw-bg-studio-surface",
  isMobile.value
    ? "tw-flex tw-h-full tw-w-full tw-flex-col tw-overflow-hidden"
    : "tw-flex tw-h-full tw-w-full tw-flex-col tw-overflow-hidden",
]);

const createTabsClass = computed(() => [
  // The tab header has desktop/mobile-specific SCSS guards for border, spacing,
  // sticky offsets and active underline. Avoid Tailwind border/negative-margin
  // utilities here so the before_front tab header remains visually identical.
  "studio-create-tabs tw-shrink-0 tw-overflow-x-auto tw-bg-studio-surface",
]);
const contentScrollbar = useOverlayScrollbar(
  createContentRef,
  {overflow: {x: "hidden", y: "scroll"}},
  {watchSource: isMobile}
);

const {
  handleKeyboardFocusIn: handleCreateFocusGuardIn,
  handleKeyboardFocusOut: handleCreateFocusGuardOut,
} = useKeyboardFocusGuard({
  enabled: isMobile,
  scrollContainer: () => contentScrollbar.getViewport(),
  ignoreInput: true,
  // Studio create keeps textarea scrolling local to its content viewport.
  // Android Chrome can otherwise scroll the document itself when a top textarea
  // receives focus, hiding the Studio header and leaving a large blank area.
  ignoreTextarea: true,
  fieldSelector: "label, fieldset",
  delays: [80, 180, 340, 560],
  edgePaddingTop: 14,
  edgePaddingBottom: 24,
});
let textareaFocusTimers = [];
let focusedTextarea = null;
let textareaFocusState = null;

const TEXTAREA_TOP_SCROLL_SENTINEL = 12;

function isTextareaElement(element) {
  return element?.tagName === "TEXTAREA";
}

function clearTextareaFocusTimers() {
  if (typeof window === "undefined") return;
  textareaFocusTimers.forEach((timer) => window.clearTimeout(timer));
  textareaFocusTimers = [];
}

function clearTextareaFocusState() {
  focusedTextarea = null;
  textareaFocusState = null;
  clearTextareaFocusTimers();
}

function getCreateScrollViewport() {
  return contentScrollbar.getViewport() || createContentRef.value;
}

function restoreDocumentScrollPosition() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  // The Studio create page owns its own scroll viewport. If Android Chrome moves
  // the document while opening the keyboard, the header/tabs can disappear above
  // the address bar. Keep the document fixed and only move the form viewport.
  if (window.scrollX !== 0 || window.scrollY !== 0) {
    window.scrollTo({top: 0, left: 0, behavior: "auto"});
  }
  if (document.documentElement?.scrollTop) {
    document.documentElement.scrollTop = 0;
  }
  if (document.body?.scrollTop) {
    document.body.scrollTop = 0;
  }
}

function ensureTextareaVisibleInCreateViewport(textarea) {
  const scroller = getCreateScrollViewport();
  if (!textarea || !scroller) return;

  const field = textarea.closest?.("label, fieldset") || textarea;
  const visualViewport = window.visualViewport;
  const scrollerRect = scroller.getBoundingClientRect();
  const fieldRect = field.getBoundingClientRect();
  const viewportOffsetTop = Math.round(visualViewport?.offsetTop || 0);
  const viewportHeight = Math.round(
    visualViewport?.height || window.innerHeight || scrollerRect.bottom
  );
  const visibleBottom = Math.min(
    scrollerRect.bottom,
    viewportOffsetTop + viewportHeight
  );
  const bottomPadding = 28;
  const overflowBottom = fieldRect.bottom - (visibleBottom - bottomPadding);

  // Only move down when the textarea is actually covered by the keyboard.
  // Do not auto-scroll upward for top textarea fields because Chrome may already
  // be adjusting the visual viewport; doing both causes the header to be hidden.
  if (overflowBottom > 3) {
    scroller.scrollBy?.({top: overflowBottom, left: 0, behavior: "auto"});
  }
}

function restoreTextareaTopFocusScroll(textarea) {
  const scroller = getCreateScrollViewport();
  const state = textareaFocusState;
  if (!textarea || !scroller || !state || state.element !== textarea) return;

  // When the field was touched while the create viewport was at the very top,
  // Android Chrome may auto-scroll the internal viewport so the textarea sits at
  // the top edge, which hides the Studio header/tabs. Restore the pre-focus
  // top sentinel first, then only move down again if the keyboard actually
  // covers the field.
  if (state.lockTopScroll && scroller.scrollTop > state.scrollTop + 2) {
    scroller.scrollTop = state.scrollTop;
    contentScrollbar.update();
  }
}

function runTextareaFocusCorrection(textarea) {
  if (!isMobile.value || typeof window === "undefined") return;
  if (textarea !== focusedTextarea) return;

  contentScrollbar.update();
  restoreDocumentScrollPosition();
  restoreTextareaTopFocusScroll(textarea);
  ensureTextareaVisibleInCreateViewport(textarea);
}

function scheduleTextareaFocusCorrection(textarea) {
  if (!isMobile.value || typeof window === "undefined") return;
  clearTextareaFocusTimers();
  focusedTextarea = textarea;
  textareaFocusTimers = [0, 40, 90, 160, 260, 420, 620].map((delay) =>
    window.setTimeout(() => runTextareaFocusCorrection(textarea), delay)
  );
}

function primeTextareaFocusScroll(textarea) {
  if (!isMobile.value || !isTextareaElement(textarea)) return;

  const scroller = getCreateScrollViewport();
  if (!scroller) return;

  restoreDocumentScrollPosition();
  contentScrollbar.update();

  const currentScrollTop = Math.max(0, scroller.scrollTop || 0);
  const lockTopScroll = currentScrollTop <= TEXTAREA_TOP_SCROLL_SENTINEL;

  // Android Chrome has a native focus-scroll edge case when a textarea receives
  // focus while the internal Studio create viewport is at the very top. Move the
  // internal viewport to a small, stable sentinel before focus and remember it.
  // If Chrome later auto-scrolls the viewport upward/downward while opening the
  // keyboard, the scheduled correction restores this sentinel instead of letting
  // the Studio header/tabs disappear.
  if (lockTopScroll) {
    scroller.scrollTop = TEXTAREA_TOP_SCROLL_SENTINEL;
    contentScrollbar.update();
  }

  textareaFocusState = {
    element: textarea,
    scrollTop: lockTopScroll ? TEXTAREA_TOP_SCROLL_SENTINEL : currentScrollTop,
    lockTopScroll,
  };
}

function handleCreatePointerDown(event) {
  const target = event?.target;
  if (isTextareaElement(target)) {
    primeTextareaFocusScroll(target);
  }
}

function handleCreateFocusIn(event) {
  handleCreateFocusGuardIn(event);

  if (isTextareaElement(event?.target)) {
    scheduleTextareaFocusCorrection(event.target);
  }
}

function handleCreateFocusOut(event) {
  handleCreateFocusGuardOut(event);
  if (event?.target === focusedTextarea) {
    clearTextareaFocusState();
  }
}

onBeforeUnmount(clearTextareaFocusState);

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
