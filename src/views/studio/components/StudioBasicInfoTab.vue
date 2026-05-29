<template>
  <div class="studio-form-stack">
    <label>대표이미지<input :value="draft.image" placeholder="이미지 URL 또는 업로드 경로" @input="updateField('image', $event.target.value)" /></label>
    <label class="studio-category-field">
      카테고리
      <button class="studio-select-like" type="button" @click="$emit('open-category')">
        <span>{{ selectedCategoryLabel }}</span>
        <span aria-hidden="true">⌄</span>
      </button>
    </label>
    <label>Assistant 이름<input :value="draft.name" placeholder="Assistant 이름" @input="updateField('name', $event.target.value)" /></label>
    <label>Instruction<textarea :value="draft.instruction" rows="5" placeholder="Assistant가 따라야 할 지시사항" @input="updateField('instruction', $event.target.value)" /></label>
    <label>설명<textarea :value="draft.description" rows="4" placeholder="사용자에게 보여줄 설명" @input="updateField('description', $event.target.value)" /></label>
    <label v-for="index in 8" :key="index">예시 프롬프트 {{ index }}<input :value="draft.prompts[index - 1]" :placeholder="`예시 프롬프트 ${index}`" @input="$emit('update-prompt', index - 1, $event.target.value)" /></label>
  </div>
</template>

<script setup>
defineProps({
  draft: {type: Object, required: true},
  selectedCategoryLabel: {type: String, default: "카테고리 선택"},
});
const emit = defineEmits(["update-field", "update-prompt", "open-category"]);
function updateField(field, value) {
  emit("update-field", field, value);
}
</script>
