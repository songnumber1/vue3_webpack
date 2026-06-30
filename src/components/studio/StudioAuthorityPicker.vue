<template>
  <div
    v-if="open"
    class="studio-picker-backdrop tw-fixed tw-inset-0 tw-z-modal"
    @click.self="noop"
  >
    <section
      class="studio-picker studio-picker--authority tw-bg-studio-surface tw-text-studio-text"
      role="dialog"
      aria-modal="true"
      :aria-label="t('studio.share.pickerTitle')"
    >
      <header class="studio-picker__head studio-picker__head--authority">
        <button
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
        <div
          class="studio-authority-picker__search studio-search tw-relative tw-w-full tw-min-w-0 tw-flex-none"
        >
          <label class="sr-only" for="studio-authority-picker-search">
            {{ t("studio.share.searchLabel") }}
          </label>
          <input
            id="studio-authority-picker-search"
            v-model="searchText"
            type="search"
            :placeholder="t('studio.share.searchPlaceholder')"
            autocomplete="off"
            class="tw-box-border tw-min-h-[44px] tw-w-full tw-min-w-0 tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-py-2.5 tw-pl-3 tw-pr-12 tw-text-inherit"
          />
          <span
            class="studio-icon studio-icon--search tw-pointer-events-none tw-absolute tw-right-4 tw-top-1/2 tw-h-[18px] tw-w-[18px] -tw-translate-y-1/2 tw-text-studio-muted"
            aria-hidden="true"
          ></span>
        </div>

        <div
          ref="gridShellRef"
          class="studio-authority-picker__grid-shell tw-flex tw-min-h-0 tw-flex-1 tw-overflow-hidden"
        >
          <div
            class="studio-authority-picker-grid tw-grid tw-min-h-0 tw-flex-1 tw-content-start tw-overflow-hidden tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface"
            role="table"
            :aria-label="t('studio.share.pickerTitle')"
          >
            <div
              class="studio-authority-picker-grid__head"
              :class="gridRowClass"
              role="row"
            >
              <div
                :class="[gridCellClass, checkboxCellClass]"
                role="columnheader"
              >
                <input
                  :class="checkboxClass"
                  type="checkbox"
                  :checked="allPagedChecked"
                  :disabled="!pagedAuthorities.length"
                  :aria-label="t('studio.share.selectAll')"
                  @change="toggleAllPaged($event.target.checked)"
                />
              </div>
              <div
                :class="[gridCellClass, headerCellClass, nameCellClass]"
                role="columnheader"
              >
                {{ t("studio.share.authorityName") }}
              </div>
              <div
                :class="[gridCellClass, headerCellClass, descriptionCellClass]"
                role="columnheader"
              >
                {{ t("studio.share.description") }}
              </div>
            </div>
            <label
              v-for="auth in pagedAuthorities"
              :key="auth.deptId"
              class="studio-authority-picker-grid__row tw-m-0 tw-cursor-pointer"
              :class="gridRowClass"
              role="row"
            >
              <div :class="[gridCellClass, checkboxCellClass]" role="cell">
                <input
                  :class="checkboxClass"
                  type="checkbox"
                  :checked="selectedIds.includes(auth.deptId)"
                  :aria-label="auth.deptNameKo"
                  @change="toggleAuthority(auth.deptId, $event.target.checked)"
                />
              </div>
              <div :class="[gridCellClass, nameCellClass]" role="cell">
                {{ auth.deptNameKo }}
              </div>
              <div :class="[gridCellClass, descriptionCellClass]" role="cell">
                {{ auth.description }}
              </div>
            </label>
            <div
              v-if="!filteredAuthorities.length"
              class="studio-picker__empty"
              :class="emptyClass"
            >
              {{ t("studio.share.pickerEmpty") }}
            </div>
          </div>
        </div>

        <nav
          class="studio-authority-pagination"
          :class="paginationClass"
          :aria-label="t('studio.share.pickerTitle')"
        >
          <button
            :class="paginationButtonClass"
            type="button"
            :disabled="page <= 1"
            @click="goPage(page - 1)"
          >
            ‹
          </button>
          <button
            v-for="item in pageItems"
            :key="item"
            :class="[paginationButtonClass, {active: page === item}]"
            type="button"
            @click="goPage(item)"
          >
            {{ item }}
          </button>
          <button
            :class="paginationButtonClass"
            type="button"
            :disabled="page >= maxPage"
            @click="goPage(page + 1)"
          >
            ›
          </button>
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
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
const {t} = useI18n();
const {shouldUseOverlayScrollbar} = useOverlayScrollPolicy();

const props = defineProps({
  open: {type: Boolean, default: false},
  authorities: {type: Array, default: () => []},
});
const emit = defineEmits(["close", "add"]);
const page = ref(1);
const selectedIds = ref([]);
const searchText = ref("");
const gridShellRef = ref(null);
const pageSize = 8;
const normalizedSearchText = computed(() =>
  searchText.value.trim().toLowerCase()
);
const filteredAuthorities = computed(() => {
  const keyword = normalizedSearchText.value;
  if (!keyword) return props.authorities;
  return props.authorities.filter((auth) => {
    const name = String(auth.deptNameKo || "").toLowerCase();
    const description = String(auth.description || "").toLowerCase();
    return name.includes(keyword) || description.includes(keyword);
  });
});
const maxPage = computed(() =>
  Math.max(1, Math.ceil(filteredAuthorities.value.length / pageSize))
);
const pagedAuthorities = computed(() =>
  filteredAuthorities.value.slice(
    (page.value - 1) * pageSize,
    page.value * pageSize
  )
);
const pageItems = computed(() =>
  Array.from({length: maxPage.value}, (_, index) => index + 1)
);
const selectedAuthorities = computed(() =>
  props.authorities.filter((auth) => selectedIds.value.includes(auth.deptId))
);
const allPagedChecked = computed(
  () =>
    pagedAuthorities.value.length > 0 &&
    pagedAuthorities.value.every((auth) =>
      selectedIds.value.includes(auth.deptId)
    )
);
const gridRowClass =
  "tw-grid tw-grid-cols-[52px_minmax(170px,0.85fr)_minmax(280px,1.45fr)] tw-items-stretch";
const gridCellClass =
  "tw-box-border tw-flex tw-min-h-[50px] tw-items-center tw-border-b tw-border-solid tw-border-studio-border tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-[1.45]";
const headerCellClass = "tw-whitespace-nowrap tw-font-extrabold";
const checkboxCellClass = "tw-justify-center tw-px-0";
const nameCellClass = "tw-min-w-0 tw-justify-start tw-whitespace-nowrap";
const descriptionCellClass =
  "tw-min-w-0 tw-justify-start tw-whitespace-normal tw-break-keep";
const checkboxClass = "tw-m-0 tw-h-[18px] tw-w-[18px] tw-accent-studio-primary";
const emptyClass =
  "tw-col-span-full tw-flex tw-min-h-[120px] tw-items-center tw-justify-center tw-border-b tw-border-solid tw-border-studio-border tw-p-5 tw-text-sm tw-text-studio-muted";
const paginationClass =
  "tw-flex tw-w-full tw-flex-none tw-items-center tw-justify-center tw-gap-2 tw-box-border";
const paginationButtonClass =
  "tw-inline-flex tw-h-[34px] tw-min-w-[34px] tw-items-center tw-justify-center tw-rounded-[5px] tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-px-2.5 tw-text-sm tw-font-bold tw-leading-none tw-text-studio-text";

useOverlayScrollbar(
  gridShellRef,
  {overflow: {x: "scroll", y: "scroll"}},
  {
    enabled: () => shouldUseOverlayScrollbar.value,
    watchSource: () => [props.open, pagedAuthorities.value.length, page.value],
  }
);
watch(
  () => props.open,
  (open) => {
    if (open) {
      page.value = 1;
      selectedIds.value = [];
      searchText.value = "";
    }
  }
);
watch(filteredAuthorities, () => {
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
