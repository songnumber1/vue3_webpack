<template>
  <section class="studio-create-page" aria-label="Assistant 만들기">
    <header class="studio-create-panel__head">
      <button v-if="isMobile" class="studio-create-panel__back" type="button" aria-label="뒤로" @click="$emit('close')">‹</button>
      <strong>Assistant 만들기</strong>
      <div class="studio-create-actions">
        <button class="studio-button" type="button" @click="$emit('apply-preview')">적용</button>
        <button class="studio-button" type="button">저장</button>
        <button class="studio-button studio-button--primary" type="button">등록</button>
        <button class="studio-button" type="button" @click="$emit('close')">닫기</button>
      </div>
    </header>

    <div class="studio-create-layout">
      <form class="studio-create-form" @submit.prevent>
        <div class="studio-create-tabs" role="tablist" aria-label="Assistant 만들기 설정">
          <button type="button" :class="{active: createTab === 'basic'}" @click="$emit('update-create-tab', 'basic')">기본 정보</button>
          <button type="button" :class="{active: createTab === 'feature'}" @click="$emit('update-create-tab', 'feature')">주요 기능</button>
          <button type="button" :class="{active: createTab === 'share'}" @click="$emit('update-create-tab', 'share')">공유범위</button>
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
import {computed} from "vue";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
import StudioPreview from "@/views/studio/components/StudioPreview.vue";

defineProps({
  createTab: {type: String, default: "basic"},
  draft: {type: Object, required: true},
  preview: {type: Object, required: true},
  previewInitial: {type: String, default: "A"},
  previewPrompts: {type: Array, default: () => []},
  selectedCategoryLabel: {type: String, default: "카테고리 선택"},
  modelOptions: {type: Array, default: () => []},
  ragOptions: {type: Array, default: () => []},
  mcpOptions: {type: Array, default: () => []},
  selectedAuthorities: {type: Array, default: () => []},
  allAuthoritiesChecked: {type: Boolean, default: false},
});
const responsiveContext = useResponsiveContext();
const isMobile = computed(() => responsiveContext.value.isMobile);
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
