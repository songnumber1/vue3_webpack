<template>
  <div v-if="open" class="studio-picker-backdrop" @click.self="noop">
    <section class="studio-picker studio-picker--authority" role="dialog" aria-modal="true" :aria-label="t('studio.share.pickerTitle')">
      <header class="studio-picker__head studio-picker__head--authority">
        <button
          v-if="isMobile"
          class="studio-picker__back"
          type="button"
          :aria-label="t('common.back')"
          @click="$emit('close')"
        >
          <span class="studio-icon studio-icon--back" aria-hidden="true"></span>
        </button>
        <strong>{{ t("studio.share.pickerTitle") }}</strong>
        <button v-if="!isMobile" type="button" :aria-label="t('common.close')" @click="$emit('close')">×</button>
      </header>
      <div class="studio-authority-picker-grid" role="table" :aria-label="t('studio.share.pickerTitle')">
        <div class="studio-authority-picker-grid__head" role="row">
          <div role="columnheader">{{ t("studio.share.authorityName") }}</div>
          <div role="columnheader">{{ t("studio.share.description") }}</div>
          <div role="columnheader">{{ t("studio.share.add") }}</div>
        </div>
        <div
          v-for="auth in pagedAuthorities"
          :key="auth.deptId"
          class="studio-authority-picker-grid__row"
          role="row"
        >
          <div role="cell">{{ auth.deptNameKo }}</div>
          <div role="cell">{{ auth.description }}</div>
          <div role="cell">
            <button class="studio-button studio-button--primary-ghost studio-authority-picker-grid__add" type="button" @click="$emit('add', auth)">
              +
            </button>
          </div>
        </div>
        <div v-if="!authorities.length" class="studio-picker__empty">{{ t("studio.share.pickerEmpty") }}</div>
      </div>
      <nav v-if="maxPage > 1" class="studio-authority-pagination" :aria-label="t('studio.share.pickerTitle')">
        <button type="button" :disabled="page <= 1" @click="goPage(page - 1)">‹</button>
        <button
          v-for="item in pageItems"
          :key="item"
          type="button"
          :class="{active: page === item}"
          @click="goPage(item)"
        >
          {{ item }}
        </button>
        <button type="button" :disabled="page >= maxPage" @click="goPage(page + 1)">›</button>
      </nav>
    </section>
  </div>
</template>

<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
const {t} = useI18n();

const props = defineProps({
  open: {type: Boolean, default: false},
  authorities: {type: Array, default: () => []},
});
defineEmits(["close", "add"]);
const responsiveContext = useResponsiveContext();
const isMobile = computed(() => responsiveContext.value.isMobile);
const page = ref(1);
const pageSize = 6;
const maxPage = computed(() => Math.max(1, Math.ceil(props.authorities.length / pageSize)));
const pagedAuthorities = computed(() => props.authorities.slice((page.value - 1) * pageSize, page.value * pageSize));
const pageItems = computed(() => Array.from({length: maxPage.value}, (_, index) => index + 1));
watch(() => props.open, (open) => {
  if (open) page.value = 1;
});
watch(maxPage, (next) => {
  if (page.value > next) page.value = next;
});
function goPage(next) {
  page.value = Math.min(maxPage.value, Math.max(1, next));
}
function noop() {}
</script>
