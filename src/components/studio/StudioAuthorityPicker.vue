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
        <button
          class="studio-picker__close"
          type="button"
          :aria-label="t('common.close')"
          @click="$emit('close')"
        >
          ×
        </button>
      </header>

      <div class="studio-authority-picker-grid" role="table" :aria-label="t('studio.share.pickerTitle')">
        <div class="studio-authority-picker-grid__head" role="row">
          <div role="columnheader">
            <input
              type="checkbox"
              :checked="allPagedChecked"
              :aria-label="t('studio.share.selectAll')"
              @change="toggleAllPaged($event.target.checked)"
            />
          </div>
          <div role="columnheader">{{ t("studio.share.authorityName") }}</div>
          <div role="columnheader">{{ t("studio.share.description") }}</div>
        </div>
        <label
          v-for="auth in pagedAuthorities"
          :key="auth.deptId"
          class="studio-authority-picker-grid__row"
          role="row"
        >
          <div role="cell">
            <input
              type="checkbox"
              :checked="selectedIds.includes(auth.deptId)"
              :aria-label="auth.deptNameKo"
              @change="toggleAuthority(auth.deptId, $event.target.checked)"
            />
          </div>
          <div role="cell">{{ auth.deptNameKo }}</div>
          <div role="cell">{{ auth.description }}</div>
        </label>
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

      <footer class="studio-picker__footer studio-picker__footer--authority">
        <button class="studio-button" type="button" @click="$emit('close')">
          {{ t("common.close") }}
        </button>
        <button
          class="studio-button studio-button--primary"
          type="button"
          :disabled="!selectedAuthorities.length"
          @click="confirmSelection"
        >
          {{ t("common.confirm") }}
        </button>
      </footer>
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
const emit = defineEmits(["close", "add"]);
const responsiveContext = useResponsiveContext();
const isMobile = computed(() => responsiveContext.value.isMobile);
const page = ref(1);
const selectedIds = ref([]);
const pageSize = 6;
const maxPage = computed(() => Math.max(1, Math.ceil(props.authorities.length / pageSize)));
const pagedAuthorities = computed(() => props.authorities.slice((page.value - 1) * pageSize, page.value * pageSize));
const pageItems = computed(() => Array.from({length: maxPage.value}, (_, index) => index + 1));
const selectedAuthorities = computed(() => props.authorities.filter((auth) => selectedIds.value.includes(auth.deptId)));
const allPagedChecked = computed(() => pagedAuthorities.value.length > 0 && pagedAuthorities.value.every((auth) => selectedIds.value.includes(auth.deptId)));
watch(() => props.open, (open) => {
  if (open) {
    page.value = 1;
    selectedIds.value = [];
  }
});
watch(maxPage, (next) => {
  if (page.value > next) page.value = next;
});
function goPage(next) {
  page.value = Math.min(maxPage.value, Math.max(1, next));
}
function toggleAuthority(deptId, checked) {
  selectedIds.value = checked
    ? Array.from(new Set([...selectedIds.value, deptId]))
    : selectedIds.value.filter((id) => id !== deptId);
}
function toggleAllPaged(checked) {
  const pageIds = pagedAuthorities.value.map((auth) => auth.deptId);
  selectedIds.value = checked
    ? Array.from(new Set([...selectedIds.value, ...pageIds]))
    : selectedIds.value.filter((id) => !pageIds.includes(id));
}
function confirmSelection() {
  if (!selectedAuthorities.value.length) return;
  emit("add", selectedAuthorities.value);
}
function noop() {}
</script>
