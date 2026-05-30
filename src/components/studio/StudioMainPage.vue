<template>
  <div class="studio-workspace__scroll">
    <div class="studio-hero">
      <div class="studio-hero__mark">AS</div>
      <h1>{{ t('studio.title') }}</h1>
      <p>{{ t('studio.heroDescription') }}</p>
    </div>

    <div class="studio-toolbar">
      <div class="studio-search">
        <label class="sr-only" for="studio-search-input">{{ t('studio.searchLabel') }}</label>
        <input
          id="studio-search-input"
          :value="searchText"
          type="search"
          :placeholder="t('studio.searchPlaceholder')"
          @input="$emit('update-search-text', $event.target.value)"
          @keydown.enter.prevent="$emit('search')"
        />
        <button class="studio-search-button" type="button" :aria-label="t('studio.searchAction')" :title="t('studio.searchAction')" @click="$emit('search')">
          <span class="studio-icon studio-icon--search" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <div class="studio-tabs-row">
      <div class="studio-tabs" role="tablist" :aria-label="t('studio.tabsLabel')">
        <button class="studio-tab" :class="{active: activeTab === 'all'}" type="button" @click="$emit('update-active-tab', 'all')">{{ t('studio.allAssistants') }}</button>
        <button class="studio-tab" :class="{active: activeTab === 'mine'}" type="button" @click="$emit('update-active-tab', 'mine')">{{ t('studio.myAssistants') }}</button>
      </div>
      <button class="studio-button studio-button--primary studio-create-entry" type="button" @click="$emit('open-create')">{{ t('studio.create') }}</button>
      <button class="studio-create-icon-entry" type="button" :aria-label="t('studio.create')" :title="t('studio.create')" @click="$emit('open-create')">
        <span class="studio-icon studio-icon--plus" aria-hidden="true"></span>
      </button>
    </div>

    <div v-if="activeTab === 'all'" class="studio-category-chips" :aria-label="t('studio.categoryLabel')">
      <button
        v-for="category in categories"
        :key="category.value"
        type="button"
        :class="{active: activeCategory === category.value}"
        @click="$emit('select-category', category.value)"
      >
        {{ category.label }}
      </button>
    </div>

    <button
      v-if="activeTab === 'all'"
      class="studio-mobile-category-select"
      type="button"
      :aria-label="t('studio.categorySelect')"
      @click="$emit('open-category-picker')"
    >
      <span>{{ activeCategoryLabel }}</span>
      <span class="studio-icon studio-icon--chevron-down" aria-hidden="true"></span>
    </button>

    <div class="studio-list-shell">
      <div class="studio-list-area">
        <div class="studio-grid">
          <ResourceCard
            v-for="studio in studios"
            :key="studio.id"
            :item="studio"
            :title="studio.name"
            :subtitle="`${studio.category} · ${studio.model}`"
            :description="studio.description"
            :meta="`${t('studio.likes')} ${studio.likes} · ${t('studio.questions')} ${studio.views}`"
            :image-text="studio.initial"
            card-class="studio-card"
            image-class="studio-card__image"
            body-class="studio-card__body"
            more-class="studio-card__more"
            meta-class="studio-card__meta"
            @open="$emit('open-detail', $event)"
          />
        </div>
      </div>
    </div>

    <nav class="studio-pagination" :aria-label="t('studio.pagination.label')">
      <button class="studio-page-icon-button" type="button" :disabled="currentPage === 1" :aria-label="t('studio.pagination.first')" @click="$emit('go-page', 1)">
        <span class="studio-icon studio-icon--page-first" aria-hidden="true"></span>
      </button>
      <button class="studio-page-icon-button" type="button" :disabled="currentPage === 1" :aria-label="t('studio.pagination.previous')" @click="$emit('go-page', currentPage - 1)">
        <span class="studio-icon studio-icon--page-prev" aria-hidden="true"></span>
      </button>
      <button
        v-for="page in pages"
        :key="page.key"
        type="button"
        :disabled="page.ellipsis"
        :class="{active: page.value === currentPage, 'studio-pagination__ellipsis': page.ellipsis}"
        @click="!page.ellipsis && $emit('go-page', page.value)"
      >
        {{ page.label }}
      </button>
      <button class="studio-page-icon-button" type="button" :disabled="currentPage === maxPage" :aria-label="t('studio.pagination.next')" @click="$emit('go-page', currentPage + 1)">
        <span class="studio-icon studio-icon--page-next" aria-hidden="true"></span>
      </button>
      <button class="studio-page-icon-button" type="button" :disabled="currentPage === maxPage" :aria-label="t('studio.pagination.last')" @click="$emit('go-page', maxPage)">
        <span class="studio-icon studio-icon--page-last" aria-hidden="true"></span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import ResourceCard from "@/components/common/catalog/ResourceCard.vue";
const {t} = useI18n();

defineProps({
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
