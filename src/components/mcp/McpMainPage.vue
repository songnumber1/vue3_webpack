<template>
  <div
    class="studio-workspace__scroll tw-box-border tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden tw-bg-studio-bg tw-p-[32px_clamp(16px,4vw,56px)_18px] tw-text-studio-text"
  >
    <div
      class="studio-hero tw-mx-auto tw-mb-6 tw-shrink-0 tw-max-w-studioHero tw-text-center tw-text-studio-text"
    >
      <div
        class="studio-hero__mark tw-mb-[14px] tw-inline-flex tw-h-14 tw-w-14 tw-items-center tw-justify-center tw-rounded-studio tw-bg-studio-primary tw-font-extrabold tw-text-app-textOnPrimary"
      >
        CS
      </div>
      <h1>{{ t("mcp.title") }}</h1>
      <p>{{ t("mcp.heroDescription") }}</p>
    </div>

    <div
      class="studio-toolbar tw-mx-auto tw-mb-4 tw-flex tw-w-full tw-max-w-studio tw-shrink-0"
    >
      <div class="studio-search tw-relative tw-min-w-0 tw-flex-1">
        <label class="sr-only" for="mcp-search-input">{{
          t("mcp.searchLabel")
        }}</label>
        <input
          id="mcp-search-input"
          :value="searchText"
          type="search"
          :placeholder="t('mcp.searchPlaceholder')"
          @input="$emit('update-search-text', $event.target.value)"
          class="tw-box-border tw-min-h-[42px] tw-w-full tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-py-2.5 tw-pl-3 tw-pr-12 tw-font-[inherit] tw-text-inherit"
          @keydown.enter.prevent="$emit('search')"
        />
        <button
          class="studio-search-button tw-absolute tw-right-1 tw-top-1 tw-inline-flex tw-h-[34px] tw-min-h-[34px] tw-w-[34px] tw-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-studio tw-border-0 tw-bg-transparent tw-text-studio-text hover:tw-bg-studio-controlHover"
          type="button"
          :aria-label="t('mcp.searchAction')"
          :title="t('mcp.searchAction')"
          @click="$emit('search')"
        >
          <span
            class="studio-icon studio-icon--search"
            aria-hidden="true"
          ></span>
        </button>
      </div>
    </div>

    <div
      class="studio-tabs-row tw-mx-auto tw-mb-4 tw-flex tw-w-full tw-max-w-studio tw-shrink-0 tw-items-end tw-justify-between tw-gap-3 tw-border-b tw-border-studio-border"
    >
      <div
        class="studio-tabs tw-flex tw-min-w-0"
        role="tablist"
        :aria-label="t('mcp.tabsLabel')"
      >
        <button
          class="studio-tab tw-shrink-0 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-px-3.5 tw-py-3 tw-text-studio-muted hover:tw-bg-studio-controlHover"
          :class="{
            active: activeTab === 'all',
            'tw-text-studio-text tw-shadow-[inset_0_-2px_0_var(--studio-primary)]':
              activeTab === 'all',
          }"
          type="button"
          @click="$emit('update-active-tab', 'all')"
        >
          {{ t("mcp.allConnectors") }}
        </button>
        <button
          class="studio-tab tw-cursor-pointer tw-border-0 tw-bg-transparent tw-px-3.5 tw-py-3 tw-text-studio-muted hover:tw-bg-studio-controlHover"
          :class="{
            active: activeTab === 'mine',
            'tw-text-studio-text tw-shadow-[inset_0_-2px_0_var(--studio-primary)]':
              activeTab === 'mine',
          }"
          type="button"
          @click="$emit('update-active-tab', 'mine')"
        >
          {{ t("mcp.myConnectors") }}
        </button>
      </div>
      <button
        class="studio-button studio-button--primary studio-create-entry tw-mb-2 tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center"
        type="button"
        @click="$emit('open-create')"
      >
        {{ t("mcp.create") }}
      </button>
      <button
        class="studio-create-icon-entry tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center"
        type="button"
        :aria-label="t('mcp.create')"
        :title="t('mcp.create')"
        @click="$emit('open-create')"
      >
        <span class="studio-icon studio-icon--plus" aria-hidden="true"></span>
      </button>
    </div>

    <div
      v-if="activeTab === 'all'"
      class="studio-category-chips tw-mx-auto tw-mb-3 tw-mt-[-4px] tw-flex tw-w-full tw-max-w-studio tw-shrink-0 tw-flex-wrap tw-items-center tw-gap-2 tw-overflow-visible"
      :aria-label="t('mcp.categoryLabel')"
    >
      <button
        v-for="category in categories"
        :key="category.value"
        type="button"
        class="tw-min-h-8 tw-shrink-0 tw-cursor-pointer tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-px-[13px] tw-font-bold tw-text-studio-muted hover:tw-bg-studio-controlHover"
        :class="{
          active: activeCategory === category.value,
          'tw-border-studio-primary tw-bg-studio-primary tw-text-app-textOnPrimary':
            activeCategory === category.value,
        }"
        @click="$emit('select-category', category.value)"
      >
        {{ category.label }}
      </button>
    </div>

    <button
      v-if="activeTab === 'all'"
      class="studio-mobile-category-select tw-shrink-0 tw-items-center tw-justify-between"
      type="button"
      :aria-label="t('mcp.categorySelect')"
      @click="$emit('open-category-picker')"
    >
      <span>{{ activeCategoryLabel }}</span>
      <span
        class="studio-icon studio-icon--chevron-down"
        aria-hidden="true"
      ></span>
    </button>

    <div
      v-if="activeTab === 'mine'"
      class="mcp-created-filter-row tw-mx-auto tw-mb-3 tw-mt-[-4px] tw-flex tw-w-full tw-max-w-studio tw-shrink-0 tw-justify-start"
    >
      <label
        class="mcp-created-filter tw-inline-flex tw-shrink-0 tw-cursor-pointer tw-select-none tw-items-center tw-gap-2 tw-self-start tw-rounded-[8px] tw-border tw-border-solid tw-border-studio-border tw-bg-studio-panel tw-px-3 tw-py-[9px] tw-text-[14px] tw-font-semibold tw-leading-[1.35] tw-text-studio-text"
      >
        <input
          :checked="createdOnly"
          class="tw-m-0 tw-h-4 tw-w-4 tw-shrink-0 tw-accent-studio-primary"
          type="checkbox"
          @change="$emit('update-created-only', $event.target.checked)"
        />
        <span>{{ t("mcp.createdOnly") }}</span>
      </label>
    </div>

    <div
      class="studio-list-shell tw-mx-auto tw-flex tw-min-h-0 tw-w-full tw-max-w-studio tw-flex-1 tw-flex-col tw-overflow-hidden"
    >
      <div
        ref="listAreaRef"
        data-studio-list-scroll="true"
        class="studio-list-area tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-pr-0.5"
      >
        <div
          class="studio-grid tw-grid tw-min-w-0 tw-grid-cols-2 tw-gap-[14px] tw-pb-1.5"
        >
          <ResourceCard
            v-for="mcp in mcps"
            :key="mcp.id"
            :item="mcp"
            :title="mcp.name"
            :subtitle="`${mcp.category} · ${mcp.model}`"
            :description="mcp.description"
            :meta="`${t('mcp.likes')} ${mcp.likes} · ${t('mcp.subscribers')} ${mcp.views}`"
            :image-text="mcp.initial"
            card-class="studio-card tw-grid tw-grid-cols-[52px_minmax(0,1fr)] tw-gap-3 tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-p-4 tw-text-inherit tw-cursor-pointer hover:tw-bg-studio-controlHover"
            image-class="studio-card__image tw-inline-flex tw-h-[52px] tw-w-[52px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-studio tw-bg-studio-primary tw-font-extrabold tw-text-app-textOnPrimary"
            body-class="studio-card__body tw-grid tw-min-w-0 tw-gap-[5px]"
            more-class="studio-card__more tw-absolute tw-right-[14px] tw-top-3 tw-inline-flex tw-items-center tw-justify-center tw-text-studio-muted tw-font-black tw-tracking-[1px]"
            meta-class="studio-card__meta tw-col-span-full tw-text-xs tw-text-studio-muted"
            @open="$emit('open-detail', $event)"
          />
        </div>
      </div>
    </div>

    <nav
      class="studio-pagination tw-mx-auto tw-mt-[14px] tw-flex tw-w-full tw-shrink-0 tw-items-center tw-justify-center tw-gap-1.5 tw-border-t tw-border-studio-border tw-pt-[14px]"
      :aria-label="t('mcp.pagination.label')"
    >
      <button
        class="studio-page-icon-button tw-inline-flex tw-h-[34px] tw-min-w-[34px] tw-items-center tw-justify-center tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-text-inherit disabled:tw-cursor-not-allowed disabled:tw-opacity-45"
        type="button"
        :disabled="currentPage === 1"
        :aria-label="t('mcp.pagination.first')"
        @click="$emit('go-page', 1)"
      >
        <span
          class="studio-icon studio-icon--page-first"
          aria-hidden="true"
        ></span>
      </button>
      <button
        class="studio-page-icon-button tw-inline-flex tw-h-[34px] tw-min-w-[34px] tw-items-center tw-justify-center tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-text-inherit disabled:tw-cursor-not-allowed disabled:tw-opacity-45"
        type="button"
        :disabled="currentPage === 1"
        :aria-label="t('mcp.pagination.previous')"
        @click="$emit('go-page', currentPage - 1)"
      >
        <span
          class="studio-icon studio-icon--page-prev"
          aria-hidden="true"
        ></span>
      </button>
      <button
        v-for="page in pages"
        :key="page.key"
        type="button"
        class="tw-h-[34px] tw-min-w-[34px] tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-text-inherit disabled:tw-cursor-not-allowed disabled:tw-opacity-45"
        :disabled="page.ellipsis"
        :class="{
          active: page.value === currentPage,
          'studio-pagination__ellipsis': page.ellipsis,
          'tw-border-studio-primary tw-font-bold tw-text-studio-primary':
            page.value === currentPage,
          'tw-border-transparent tw-bg-transparent tw-opacity-100 disabled:tw-cursor-default disabled:tw-opacity-100':
            page.ellipsis,
        }"
        @click="!page.ellipsis && $emit('go-page', page.value)"
      >
        {{ page.label }}
      </button>
      <button
        class="studio-page-icon-button tw-inline-flex tw-h-[34px] tw-min-w-[34px] tw-items-center tw-justify-center tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-text-inherit disabled:tw-cursor-not-allowed disabled:tw-opacity-45"
        type="button"
        :disabled="currentPage === maxPage"
        :aria-label="t('mcp.pagination.next')"
        @click="$emit('go-page', currentPage + 1)"
      >
        <span
          class="studio-icon studio-icon--page-next"
          aria-hidden="true"
        ></span>
      </button>
      <button
        class="studio-page-icon-button tw-inline-flex tw-h-[34px] tw-min-w-[34px] tw-items-center tw-justify-center tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-text-inherit disabled:tw-cursor-not-allowed disabled:tw-opacity-45"
        type="button"
        :disabled="currentPage === maxPage"
        :aria-label="t('mcp.pagination.last')"
        @click="$emit('go-page', maxPage)"
      >
        <span
          class="studio-icon studio-icon--page-last"
          aria-hidden="true"
        ></span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import {ref} from "vue";
import {useI18n} from "vue-i18n";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import ResourceCard from "@/components/common/catalog/ResourceCard.vue";
const {t} = useI18n();
const listAreaRef = ref(null);

const props = defineProps({
  searchText: {type: String, default: ""},
  activeTab: {type: String, default: "all"},
  activeCategory: {type: String, default: "ALL"},
  activeCategoryLabel: {type: String, default: ""},
  createdOnly: {type: Boolean, default: false},
  categories: {type: Array, default: () => []},
  mcps: {type: Array, default: () => []},
  pages: {type: Array, default: () => []},
  currentPage: {type: Number, default: 1},
  maxPage: {type: Number, default: 1},
});

useOverlayScrollbar(
  listAreaRef,
  {overflow: {x: "hidden", y: "scroll"}},
  {
    disableOnMobile: false,
    watchSource: () => [
      props.activeTab,
      props.activeCategory,
      props.currentPage,
      props.mcps.length,
    ],
  }
);

defineEmits([
  "update-search-text",
  "search",
  "update-active-tab",
  "select-category",
  "open-category-picker",
  "open-create",
  "open-detail",
  "update-created-only",
  "go-page",
]);
</script>
