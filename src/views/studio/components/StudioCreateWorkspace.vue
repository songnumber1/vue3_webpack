<template>
  <StudioCreatePage
    :create-tab="createTab"
    :draft="draft"
    :preview="preview"
    :preview-initial="previewInitial"
    :preview-prompts="previewPrompts"
    :selected-category-label="selectedCategoryLabel"
    :model-options="modelOptions"
    :rag-options="ragOptions"
    :mcp-options="mcpOptions"
    :selected-authorities="selectedAuthorities"
    :all-authorities-checked="allAuthoritiesChecked"
    @close="$emit('close')"
    @apply-preview="$emit('apply-preview')"
    @update-create-tab="$emit('update-create-tab', $event)"
    @update-draft-field="forwardDraftField"
    @update-draft-prompt="forwardDraftPrompt"
    @open-category="categorySelectorOpen = true"
    @toggle-model="$emit('toggle-model', $event)"
    @update-rags="$emit('update-rags', $event)"
    @update-mcps="$emit('update-mcps', $event)"
    @update-scope="$emit('update-scope', $event)"
    @open-authority-picker="authorityPickerOpen = true"
    @delete-checked-authorities="$emit('delete-checked-authorities')"
    @toggle-all-authorities="$emit('toggle-all-authorities', $event)"
    @toggle-authority="forwardAuthorityToggle"
  />

  <StudioCategoryPicker
    :open="categorySelectorOpen"
    :categories="categoryOptions"
    :selected-value="draft.category"
    @close="categorySelectorOpen = false"
    @select="selectCategory"
  />

  <StudioAuthorityPicker
    :open="authorityPickerOpen"
    :authorities="availableAuthorities"
    @close="authorityPickerOpen = false"
    @add="addAuthority"
  />
</template>

<script setup>
import {ref} from "vue";
import StudioCreatePage from "@/views/studio/components/StudioCreatePage.vue";
import StudioCategoryPicker from "@/views/studio/components/StudioCategoryPicker.vue";
import StudioAuthorityPicker from "@/views/studio/components/StudioAuthorityPicker.vue";

defineProps({
  createTab: {type: String, default: "basic"},
  draft: {type: Object, required: true},
  preview: {type: Object, required: true},
  previewInitial: {type: String, default: "A"},
  previewPrompts: {type: Array, default: () => []},
  selectedCategoryLabel: {type: String, default: "카테고리 선택"},
  categoryOptions: {type: Array, default: () => []},
  modelOptions: {type: Array, default: () => []},
  ragOptions: {type: Array, default: () => []},
  mcpOptions: {type: Array, default: () => []},
  selectedAuthorities: {type: Array, default: () => []},
  availableAuthorities: {type: Array, default: () => []},
  allAuthoritiesChecked: {type: Boolean, default: false},
});
const emit = defineEmits([
  "close",
  "apply-preview",
  "update-create-tab",
  "update-draft-field",
  "update-draft-prompt",
  "toggle-model",
  "update-rags",
  "update-mcps",
  "update-scope",
  "add-authority",
  "delete-checked-authorities",
  "toggle-all-authorities",
  "toggle-authority",
]);

const categorySelectorOpen = ref(false);
const authorityPickerOpen = ref(false);

function forwardDraftField(field, value) {
  emit("update-draft-field", field, value);
}
function forwardDraftPrompt(index, value) {
  emit("update-draft-prompt", index, value);
}
function forwardAuthorityToggle(deptId, checked) {
  emit("toggle-authority", deptId, checked);
}
function selectCategory(value) {
  emit("update-draft-field", "category", value);
  categorySelectorOpen.value = false;
}
function addAuthority(auth) {
  emit("add-authority", auth);
  authorityPickerOpen.value = false;
}
</script>
