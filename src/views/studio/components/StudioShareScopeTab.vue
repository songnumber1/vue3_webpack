<template>
  <div class="studio-form-stack studio-share-tab">
    <fieldset class="studio-scope-fieldset">
      <legend>공개 대상</legend>
      <label class="studio-radio-card"><input :checked="scope === 'public'" type="radio" value="public" @change="$emit('update-scope', 'public')" /><span><strong>공개</strong><small>전체 또는 선택한 권한 사용자가 사용할 수 있습니다.</small></span></label>
      <label class="studio-radio-card"><input :checked="scope === 'private'" type="radio" value="private" @change="$emit('update-scope', 'private')" /><span><strong>비공개</strong><small>지정한 사용자만 사용할 수 있습니다.</small></span></label>
    </fieldset>
    <div class="studio-authority-actions">
      <button class="studio-button studio-button--primary-ghost" type="button" @click="$emit('open-authority-picker')">+ 추가</button>
      <button class="studio-button studio-button--danger-ghost" type="button" @click="$emit('delete-checked-authorities')">삭제</button>
    </div>
    <div class="studio-authority-grid" role="table" aria-label="공유 권한 목록">
      <div class="studio-authority-grid__head" role="row">
        <div role="columnheader"><input type="checkbox" :checked="allAuthoritiesChecked" @change="$emit('toggle-all-authorities', $event.target.checked)" /></div>
        <div role="columnheader">권한명</div>
        <div role="columnheader">설명</div>
      </div>
      <div v-for="auth in authorities" :key="auth.deptId" class="studio-authority-grid__row" role="row">
        <div role="cell"><input :checked="auth.checked" type="checkbox" @change="$emit('toggle-authority', auth.deptId, $event.target.checked)" /></div>
        <div role="cell">{{ auth.deptNameKo }}</div>
        <div role="cell">{{ auth.description }}</div>
      </div>
      <div v-if="!authorities.length" class="studio-authority-grid__empty">추가된 공개 대상이 없습니다.</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  scope: {type: String, default: "private"},
  authorities: {type: Array, default: () => []},
  allAuthoritiesChecked: {type: Boolean, default: false},
});
defineEmits([
  "update-scope",
  "open-authority-picker",
  "delete-checked-authorities",
  "toggle-all-authorities",
  "toggle-authority",
]);
</script>
