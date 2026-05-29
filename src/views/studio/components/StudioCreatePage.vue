<template>
  <section ref="createPageRef" class="studio-create-page" :aria-label="t('studio.createPage.title')" @focusin="handleCreateFocusIn">
    <header class="studio-create-panel__head">
      <button
        v-if="isMobile"
        class="studio-create-panel__back studio-create-icon-button"
        type="button"
        :aria-label="t('studio.createPage.back')"
        :title="t('studio.createPage.back')"
        @click="$emit('close')"
      >
        <span class="studio-icon studio-icon--back" aria-hidden="true"></span>
      </button>
      <strong class="studio-create-panel__title">{{ t('studio.createPage.title') }}</strong>
      <div class="studio-create-actions">
        <button class="studio-button studio-create-action-button" type="button" :aria-label="t('studio.createPage.apply')" :title="t('studio.createPage.apply')" @click="$emit('apply-preview')">
          <span class="studio-icon studio-icon--apply" aria-hidden="true"></span>
          <span>{{ t('studio.createPage.apply') }}</span>
        </button>
        <button class="studio-button studio-create-action-button" type="button" :aria-label="t('studio.createPage.save')" :title="t('studio.createPage.save')">
          <span class="studio-icon studio-icon--save" aria-hidden="true"></span>
          <span>{{ t('studio.createPage.save') }}</span>
        </button>
        <button class="studio-button studio-button--primary studio-create-action-button" type="button" :aria-label="t('studio.createPage.register')" :title="t('studio.createPage.register')">
          <span class="studio-icon studio-icon--register" aria-hidden="true"></span>
          <span>{{ t('studio.createPage.register') }}</span>
        </button>
        <button class="studio-button studio-create-action-button" type="button" :aria-label="t('studio.createPage.close')" :title="t('studio.createPage.close')" @click="$emit('close')">
          <span class="studio-icon studio-icon--close" aria-hidden="true"></span>
          <span>{{ t('studio.createPage.close') }}</span>
        </button>
      </div>
    </header>

    <div class="studio-create-layout">
      <form class="studio-create-form" @submit.prevent>
        <div class="studio-create-tabs" role="tablist" :aria-label="t('studio.createPage.settingsLabel')">
          <button type="button" :class="{active: createTab === 'basic'}" @click="$emit('update-create-tab', 'basic')">{{ t('studio.createPage.basic') }}</button>
          <button type="button" :class="{active: createTab === 'feature'}" @click="$emit('update-create-tab', 'feature')">{{ t('studio.createPage.feature') }}</button>
          <button type="button" :class="{active: createTab === 'share'}" @click="$emit('update-create-tab', 'share')">{{ t('studio.createPage.share') }}</button>
        </div>

        <StudioBasicInfoTab
          v-if="createTab === 'basic'"
          :draft="draft"
          :selected-category-label="selectedCategoryLabel"
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
      </form>

      <StudioPreview
        :initial="previewInitial"
        :name="preview.name"
        :description="preview.description"
        :prompts="previewPrompts"
      />
    </div>
  </section>
</template>

<script setup>
import StudioBasicInfoTab from "@/views/studio/components/StudioBasicInfoTab.vue";
import StudioFeatureTab from "@/views/studio/components/StudioFeatureTab.vue";
import StudioShareScopeTab from "@/views/studio/components/StudioShareScopeTab.vue";
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
import StudioPreview from "@/views/studio/components/StudioPreview.vue";

const {t} = useI18n();

defineProps({
  createTab: {type: String, default: "basic"},
  draft: {type: Object, required: true},
  preview: {type: Object, required: true},
  previewInitial: {type: String, default: "A"},
  previewPrompts: {type: Array, default: () => []},
  selectedCategoryLabel: {type: String, default: ""},
  modelOptions: {type: Array, default: () => []},
  ragOptions: {type: Array, default: () => []},
  mcpOptions: {type: Array, default: () => []},
  selectedAuthorities: {type: Array, default: () => []},
  allAuthoritiesChecked: {type: Boolean, default: false},
});
const responsiveContext = useResponsiveContext();
const isMobile = computed(() => responsiveContext.value.isMobile);

const createPageRef = ref(null);
let focusScrollTimer = 0;

function handleCreateFocusIn(event) {
  if (!isMobile.value) {
    return;
  }
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  if (!["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
    return;
  }
  window.clearTimeout(focusScrollTimer);
  focusScrollTimer = window.setTimeout(() => {
    const scroller = createPageRef.value?.querySelector?.(".studio-create-layout");
    const field = target.closest?.("label, fieldset") || target;
    if (!field || !scroller) {
      target.scrollIntoView({block: "center", inline: "nearest", behavior: "smooth"});
      return;
    }
    const scrollerRect = scroller.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();
    const desiredTop = scrollerRect.top + Math.max(72, scrollerRect.height * 0.34);
    const delta = fieldRect.top - desiredTop;
    scroller.scrollBy({top: delta, left: 0, behavior: "smooth"});
  }, 180);
}

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
</script>
