<template>
  <div class="flex flex-col gap-5">
    <fieldset class="m-0 flex flex-col gap-3 rounded-ui border border-app-border bg-app-surface p-4">
      <legend class="px-1 text-sm font-black text-app-text">{{ t("studio.share.target") }}</legend>
      <label class="flex cursor-pointer items-center gap-3 rounded-ui border border-app-border p-3 text-sm font-extrabold text-app-text" :class="scope === 'public' ? 'border-app-primary bg-app-primarySoft text-app-primary' : ''">
        <input
          class="h-4 w-4 accent-[var(--primary,#10a37f)]"
          :checked="scope === 'public'"
          type="radio"
          value="public"
          @change="$emit('update-scope', 'public')"
        />
        <span>{{ t("studio.share.public") }}</span>
      </label>
      <label class="flex cursor-pointer items-center gap-3 rounded-ui border border-app-border p-3 text-sm font-extrabold text-app-text" :class="scope === 'private' ? 'border-app-primary bg-app-primarySoft text-app-primary' : ''">
        <input
          class="h-4 w-4 accent-[var(--primary,#10a37f)]"
          :checked="scope === 'private'"
          type="radio"
          value="private"
          @change="$emit('update-scope', 'private')"
        />
        <span>{{ t("studio.share.private") }}</span>
      </label>
    </fieldset>

    <section class="flex min-h-0 flex-col gap-3" :aria-label="t('studio.share.listLabel')">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <strong class="text-sm font-black text-app-text">{{ t("studio.share.listLabel") }}</strong>
        <div class="flex items-center gap-2">
          <button class="rounded-ui border border-app-primary bg-app-primarySoft px-3 py-2 text-sm font-extrabold text-app-primary" type="button" @click="$emit('open-authority-picker')">+ {{ t("studio.share.add") }}</button>
          <button class="rounded-ui border border-red-200 bg-red-50 px-3 py-2 text-sm font-extrabold text-red-600" type="button" @click="$emit('delete-checked-authorities')">{{ t("studio.share.delete") }}</button>
        </div>
      </div>
      <div class="overflow-hidden rounded-ui border border-app-border bg-app-surface" role="table" :aria-label="t('studio.share.listLabel')">
        <div class="grid grid-cols-[48px_1fr_1.4fr] border-b border-app-border bg-app-muted text-xs font-black text-app-subtle" role="row">
          <div class="flex min-h-[38px] items-center justify-center" role="columnheader"><input class="h-4 w-4 accent-[var(--primary,#10a37f)]" type="checkbox" :checked="allAuthoritiesChecked" @change="$emit('toggle-all-authorities', $event.target.checked)" /></div>
          <div class="flex min-h-[38px] items-center px-3" role="columnheader">{{ t("studio.share.authorityName") }}</div>
          <div class="flex min-h-[38px] items-center px-3 mobile:hidden" role="columnheader">{{ t("studio.share.description") }}</div>
        </div>
        <div v-for="auth in authorities" :key="auth.deptId" class="grid grid-cols-[48px_1fr_1.4fr] border-b border-app-border text-sm last:border-b-0 mobile:grid-cols-[48px_1fr]" role="row">
          <div class="flex min-h-[44px] items-center justify-center" role="cell"><input class="h-4 w-4 accent-[var(--primary,#10a37f)]" :checked="auth.checked" type="checkbox" @change="$emit('toggle-authority', auth.deptId, $event.target.checked)" /></div>
          <div class="flex min-h-[44px] min-w-0 items-center px-3 font-bold text-app-text" role="cell">{{ auth.deptNameKo }}</div>
          <div class="flex min-h-[44px] min-w-0 items-center px-3 text-app-subtle mobile:hidden" role="cell">{{ auth.description }}</div>
        </div>
        <div v-if="!authorities.length" class="p-6 text-center text-sm font-bold text-app-subtle">{{ t("studio.share.empty") }}</div>
      </div>
      <nav class="flex items-center justify-center gap-1" :aria-label="t('studio.share.listLabel')">
        <button type="button" class="h-8 w-8 rounded-ui border border-app-border text-app-subtle" disabled>‹</button>
        <button type="button" class="h-8 w-8 rounded-ui border border-app-primary bg-app-primary text-white">1</button>
        <button type="button" class="h-8 w-8 rounded-ui border border-app-border text-app-subtle" disabled>›</button>
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
