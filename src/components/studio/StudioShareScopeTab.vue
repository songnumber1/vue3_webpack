<template>
  <div class="studio-form-stack studio-share-tab tw-min-w-0">
    <fieldset class="studio-scope-fieldset">
      <legend>{{ t("studio.share.target") }}</legend>
      <label class="studio-radio-row" :class="{active: scope === 'public'}">
        <input
          :checked="scope === 'public'"
          type="radio"
          value="public"
          @change="$emit('update-scope', 'public')"
        />
        <span>{{ t("studio.share.public") }}</span>
      </label>
      <label class="studio-radio-row" :class="{active: scope === 'private'}">
        <input
          :checked="scope === 'private'"
          type="radio"
          value="private"
          @change="$emit('update-scope', 'private')"
        />
        <span>{{ t("studio.share.private") }}</span>
      </label>
    </fieldset>

    <section class="studio-authority-section tw-min-w-0" :aria-label="t('studio.share.listLabel')">
      <div class="studio-authority-section__head tw-items-center">
        <strong>{{ t("studio.share.listLabel") }}</strong>
        <div class="studio-authority-actions tw-shrink-0">
          <button class="studio-button studio-button--primary-ghost" type="button" @click="$emit('open-authority-picker')">+ {{ t("studio.share.add") }}</button>
          <button class="studio-button studio-button--danger-ghost" type="button" @click="$emit('delete-checked-authorities')">{{ t("studio.share.delete") }}</button>
        </div>
      </div>
      <div class="studio-authority-grid tw-min-w-0" role="table" :aria-label="t('studio.share.listLabel')">
        <div class="studio-authority-grid__head" role="row">
          <div role="columnheader"><input type="checkbox" :checked="allAuthoritiesChecked" @change="$emit('toggle-all-authorities', $event.target.checked)" /></div>
          <div role="columnheader">{{ t("studio.share.authorityName") }}</div>
          <div role="columnheader">{{ t("studio.share.description") }}</div>
        </div>
        <div v-for="auth in authorities" :key="auth.deptId" class="studio-authority-grid__row" role="row">
          <div role="cell"><input :checked="auth.checked" type="checkbox" @change="$emit('toggle-authority', auth.deptId, $event.target.checked)" /></div>
          <div role="cell">{{ auth.deptNameKo }}</div>
          <div role="cell">{{ auth.description }}</div>
        </div>
        <div v-if="!authorities.length" class="studio-authority-grid__empty">{{ t("studio.share.empty") }}</div>
      </div>
      <nav class="studio-authority-pagination tw-shrink-0 tw-items-center tw-justify-center" :aria-label="t('studio.share.listLabel')">
        <button type="button" disabled>‹</button>
        <button type="button" class="active">1</button>
        <button type="button" disabled>›</button>
      </nav>
    </section>
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
