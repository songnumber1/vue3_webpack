<template>
  <div class="studio-form-stack studio-share-tab">
    <fieldset class="studio-scope-fieldset">
      <legend>{{ t('studio.share.target') }}</legend>
      <label class="studio-radio-card" :class="{active: scope === 'public'}">
        <input :checked="scope === 'public'" type="radio" value="public" @change="$emit('update-scope', 'public')" />
        <span><strong>{{ t('studio.share.public') }}</strong><small>{{ t('studio.share.publicDesc') }}</small></span>
      </label>
      <label class="studio-radio-card" :class="{active: scope === 'private'}">
        <input :checked="scope === 'private'" type="radio" value="private" @change="$emit('update-scope', 'private')" />
        <span><strong>{{ t('studio.share.private') }}</strong><small>{{ t('studio.share.privateDesc') }}</small></span>
      </label>
    </fieldset>
    <div class="studio-authority-actions">
      <button class="studio-button studio-button--primary-ghost" type="button" @click="$emit('open-authority-picker')">+ {{ t('studio.share.add') }}</button>
      <button class="studio-button studio-button--danger-ghost" type="button" @click="$emit('delete-checked-authorities')">{{ t('studio.share.delete') }}</button>
    </div>
    <div class="studio-authority-grid" role="table" :aria-label="t('studio.share.listLabel')">
      <div class="studio-authority-grid__head" role="row">
        <div role="columnheader"><input type="checkbox" :checked="allAuthoritiesChecked" @change="$emit('toggle-all-authorities', $event.target.checked)" /></div>
        <div role="columnheader">{{ t('studio.share.authorityName') }}</div>
        <div role="columnheader">{{ t('studio.share.description') }}</div>
      </div>
      <div v-for="auth in authorities" :key="auth.deptId" class="studio-authority-grid__row" role="row">
        <div role="cell"><input :checked="auth.checked" type="checkbox" @change="$emit('toggle-authority', auth.deptId, $event.target.checked)" /></div>
        <div role="cell">{{ auth.deptNameKo }}</div>
        <div role="cell">{{ auth.description }}</div>
      </div>
      <div v-if="!authorities.length" class="studio-authority-grid__empty">{{ t('studio.share.empty') }}</div>
    </div>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";
const {t} = useI18n();

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
