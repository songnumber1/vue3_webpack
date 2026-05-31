<template>
  <div v-if="open" class="studio-picker-backdrop tw-fixed tw-inset-0 tw-z-modal" @click.self="noop">
    <section class="studio-picker studio-picker--authority tw-bg-studio-surface tw-text-studio-text" role="dialog" aria-modal="true" :aria-label="t('studio.share.pickerTitle')">
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

      <div class="studio-authority-picker__body tw-min-h-0">
        <div class="studio-authority-picker__search studio-search">
          <label class="sr-only" for="studio-authority-picker-search">
            {{ t("studio.share.searchLabel") }}
          </label>
          <input
            id="studio-authority-picker-search"
            v-model="searchText"
            type="search"
            :placeholder="t('studio.share.searchPlaceholder')"
            autocomplete="off"
          />
          <span class="studio-icon studio-icon--search" aria-hidden="true"></span>
        </div>

        <div ref="gridShellRef" class="studio-authority-picker__grid-shell tw-min-h-0">
          <div class="studio-authority-picker-grid" role="table" :aria-label="t('studio.share.pickerTitle')">
            <div class="studio-authority-picker-grid__head" role="row">
              <div role="columnheader">
                <input
                  type="checkbox"
                  :checked="allPagedChecked"
                  :disabled="!pagedAuthorities.length"
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
            <div v-if="!filteredAuthorities.length" class="studio-picker__empty">
              {{ t("studio.share.pickerEmpty") }}
            </div>
          </div>
        </div>

        <nav class="studio-authority-pagination" :aria-label="t('studio.share.pickerTitle')">
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
      </div>

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
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
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
const searchText = ref("");
const gridShellRef = ref(null);
const pageSize = computed(() => (isMobile.value ? 8 : 8));
const normalizedSearchText = computed(() => searchText.value.trim().toLowerCase());
const filteredAuthorities = computed(() => {
  const keyword = normalizedSearchText.value;
  if (!keyword) return props.authorities;
  return props.authorities.filter((auth) => {
    const name = String(auth.deptNameKo || "").toLowerCase();
    const description = String(auth.description || "").toLowerCase();
    return name.includes(keyword) || description.includes(keyword);
  });
});
const maxPage = computed(() => Math.max(1, Math.ceil(filteredAuthorities.value.length / pageSize.value)));
const pagedAuthorities = computed(() => filteredAuthorities.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
const pageItems = computed(() => Array.from({length: maxPage.value}, (_, index) => index + 1));
const selectedAuthorities = computed(() => props.authorities.filter((auth) => selectedIds.value.includes(auth.deptId)));
const allPagedChecked = computed(() => pagedAuthorities.value.length > 0 && pagedAuthorities.value.every((auth) => selectedIds.value.includes(auth.deptId)));
useOverlayScrollbar(
  gridShellRef,
  {overflow: {x: "scroll", y: "scroll"}},
  {watchSource: () => [props.open, pagedAuthorities.value.length, page.value]}
);
watch(() => props.open, (open) => {
  if (open) {
    page.value = 1;
    selectedIds.value = [];
    searchText.value = "";
  }
});
watch([filteredAuthorities, pageSize], () => {
  if (page.value > maxPage.value) page.value = maxPage.value;
});
watch(searchText, () => {
  page.value = 1;
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
