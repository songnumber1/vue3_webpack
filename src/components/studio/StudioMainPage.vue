<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-[18px] pt-8 text-app-text desktop:px-[clamp(16px,4vw,56px)] mobile:overflow-y-auto mobile:px-4 mobile:pb-[calc(24px+env(safe-area-inset-bottom,0px))] mobile:pt-4">
    <div class="mx-auto mb-6 max-w-[820px] shrink-0 text-center mobile:mb-4">
      <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-ui bg-app-primary text-lg font-extrabold text-white mobile:h-12 mobile:w-12">AS</div>
      <h1 class="m-0 text-[clamp(24px,4vw,36px)] font-extrabold leading-tight mobile:text-[24px]">{{ t('studio.title') }}</h1>
      <p class="mx-auto mt-2 max-w-[680px] text-[15px] leading-7 text-app-subtle mobile:text-sm mobile:leading-6">{{ t('studio.heroDescription') }}</p>
    </div>

    <div class="mx-auto w-full max-w-[980px] shrink-0">
      <div class="relative flex h-12 items-center rounded-ui border border-app-border bg-app-surface px-3 shadow-none focus-within:border-app-primary mobile:h-11">
        <label class="sr-only" for="studio-search-input">{{ t('studio.searchLabel') }}</label>
        <input
          id="studio-search-input"
          class="min-w-0 flex-1 border-0 bg-transparent pr-10 text-[15px] text-app-text outline-none placeholder:text-app-subtle"
          :value="searchText"
          type="search"
          :placeholder="t('studio.searchPlaceholder')"
          @input="$emit('update-search-text', $event.target.value)"
          @keydown.enter.prevent="$emit('search')"
        />
        <button class="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-ui text-app-subtle hover:bg-app-hover hover:text-app-text" type="button" :aria-label="t('studio.searchAction')" :title="t('studio.searchAction')" @click="$emit('search')">
          <span class="studio-icon studio-icon--search" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <div class="mx-auto mt-4 flex w-full max-w-[980px] shrink-0 items-center justify-between gap-3 mobile:mt-3">
      <div class="flex min-w-0 flex-wrap items-center gap-2 rounded-ui bg-app-muted p-1 mobile:flex-1 mobile:flex-nowrap" role="tablist" :aria-label="t('studio.tabsLabel')">
        <button class="rounded-ui px-4 py-2 text-sm font-extrabold text-app-subtle transition hover:text-app-text mobile:flex-1 mobile:px-3" :class="activeTab === 'all' ? 'bg-app-surface text-app-text shadow-sm' : ''" type="button" @click="$emit('update-active-tab', 'all')">{{ t('studio.allAssistants') }}</button>
        <button class="rounded-ui px-4 py-2 text-sm font-extrabold text-app-subtle transition hover:text-app-text mobile:flex-1 mobile:px-3" :class="activeTab === 'mine' ? 'bg-app-surface text-app-text shadow-sm' : ''" type="button" @click="$emit('update-active-tab', 'mine')">{{ t('studio.myAssistants') }}</button>
      </div>
      <button class="inline-flex h-10 items-center justify-center rounded-ui bg-app-primary px-4 text-sm font-extrabold text-white transition hover:bg-app-primaryStrong mobile:hidden" type="button" @click="$emit('open-create')">{{ t('studio.create') }}</button>
      <button class="hidden h-10 w-10 items-center justify-center rounded-ui bg-app-primary text-white mobile:inline-flex" type="button" :aria-label="t('studio.create')" :title="t('studio.create')" @click="$emit('open-create')">
        <span class="studio-icon studio-icon--plus" aria-hidden="true"></span>
      </button>
    </div>

    <div v-if="activeTab === 'all'" class="mx-auto mt-3 flex w-full max-w-[980px] shrink-0 flex-wrap gap-2 overflow-visible mobile:hidden" :aria-label="t('studio.categoryLabel')">
      <button
        v-for="category in categories"
        :key="category.value"
        type="button"
        class="rounded-full border border-app-border bg-app-surface px-3 py-2 text-sm font-bold text-app-subtle transition hover:border-app-primary hover:text-app-text"
        :class="activeCategory === category.value ? 'border-app-primary bg-app-primarySoft text-app-primary' : ''"
        @click="$emit('select-category', category.value)"
      >
        {{ category.label }}
      </button>
    </div>

    <button
      v-if="activeTab === 'all'"
      class="mx-auto mt-3 hidden h-11 w-full max-w-[980px] shrink-0 items-center justify-between rounded-ui border border-app-border bg-app-surface px-3 text-left text-sm font-extrabold text-app-text mobile:flex"
      type="button"
      :aria-label="t('studio.categorySelect')"
      @click="$emit('open-category-picker')"
    >
      <span>{{ activeCategoryLabel }}</span>
      <span class="studio-icon studio-icon--chevron-down" aria-hidden="true"></span>
    </button>

    <div class="mx-auto mt-4 flex w-full max-w-[980px] min-h-0 flex-1 overflow-hidden rounded-ui border border-app-border bg-app-surface mobile:mt-3 mobile:border-0 mobile:bg-transparent">
      <div ref="listAreaRef" class="studio-scrollbar-stable min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 mobile:p-0">
        <div class="grid grid-cols-2 gap-4 mobile:grid-cols-1 mobile:gap-3">
          <ResourceCard
            v-for="studio in studios"
            :key="studio.id"
            :item="studio"
            :title="studio.name"
            :subtitle="`${studio.category} · ${studio.model}`"
            :description="studio.description"
            :meta="`${t('studio.likes')} ${studio.likes} · ${t('studio.questions')} ${studio.views}`"
            :image-text="studio.initial"
            card-class="relative flex min-h-[190px] flex-col gap-3 rounded-ui border border-app-border bg-app-surface p-4 text-left text-app-text transition hover:border-app-primary hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-[var(--primary,#10a37f)] focus:ring-opacity-30 mobile:min-h-[168px]"
            image-class="flex h-12 w-12 items-center justify-center rounded-ui bg-app-primary text-base font-extrabold text-white"
            body-class="flex min-w-0 flex-1 flex-col gap-1 [&>strong]:text-base [&>strong]:font-extrabold [&>small]:text-xs [&>small]:font-bold [&>small]:text-app-subtle [&>span]:text-sm [&>span]:leading-6 [&>span]:text-app-subtle"
            more-class="absolute right-3 top-3 text-app-subtle"
            meta-class="mt-auto text-xs font-bold text-app-subtle"
            @open="$emit('open-detail', $event)"
          />
        </div>
      </div>
    </div>

    <nav class="mx-auto mt-4 flex w-full max-w-[980px] shrink-0 items-center justify-center gap-1 mobile:mt-3" :aria-label="t('studio.pagination.label')">
      <button class="flex h-9 w-9 items-center justify-center rounded-ui border border-app-border bg-app-surface text-app-subtle disabled:cursor-not-allowed disabled:opacity-40" type="button" :disabled="currentPage === 1" :aria-label="t('studio.pagination.first')" @click="$emit('go-page', 1)">
        <span class="studio-icon studio-icon--page-first" aria-hidden="true"></span>
      </button>
      <button class="flex h-9 w-9 items-center justify-center rounded-ui border border-app-border bg-app-surface text-app-subtle disabled:cursor-not-allowed disabled:opacity-40" type="button" :disabled="currentPage === 1" :aria-label="t('studio.pagination.previous')" @click="$emit('go-page', currentPage - 1)">
        <span class="studio-icon studio-icon--page-prev" aria-hidden="true"></span>
      </button>
      <button
        v-for="page in pages"
        :key="page.key"
        type="button"
        class="h-9 min-w-9 rounded-ui border border-app-border bg-app-surface px-3 text-sm font-extrabold text-app-subtle disabled:cursor-default disabled:border-transparent disabled:bg-transparent"
        :disabled="page.ellipsis"
        :class="page.value === currentPage ? 'border-app-primary bg-app-primary text-white' : ''"
        @click="!page.ellipsis && $emit('go-page', page.value)"
      >
        {{ page.label }}
      </button>
      <button class="flex h-9 w-9 items-center justify-center rounded-ui border border-app-border bg-app-surface text-app-subtle disabled:cursor-not-allowed disabled:opacity-40" type="button" :disabled="currentPage === maxPage" :aria-label="t('studio.pagination.next')" @click="$emit('go-page', currentPage + 1)">
        <span class="studio-icon studio-icon--page-next" aria-hidden="true"></span>
      </button>
      <button class="flex h-9 w-9 items-center justify-center rounded-ui border border-app-border bg-app-surface text-app-subtle disabled:cursor-not-allowed disabled:opacity-40" type="button" :disabled="currentPage === maxPage" :aria-label="t('studio.pagination.last')" @click="$emit('go-page', maxPage)">
        <span class="studio-icon studio-icon--page-last" aria-hidden="true"></span>
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
  categories: {type: Array, default: () => []},
  studios: {type: Array, default: () => []},
  pages: {type: Array, default: () => []},
  currentPage: {type: Number, default: 1},
  maxPage: {type: Number, default: 1},
});

useOverlayScrollbar(listAreaRef, {overflow: {x: "hidden", y: "scroll"}}, {watchSource: () => [props.activeTab, props.activeCategory, props.currentPage, props.studios.length]});

defineEmits([
  "update-search-text",
  "search",
  "update-active-tab",
  "select-category",
  "open-category-picker",
  "open-create",
  "open-detail",
  "go-page",
]);
</script>
