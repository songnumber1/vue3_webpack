<template>
  <div ref="pageScrollRef" class="studio-workspace__scroll">
    <div class="studio-hero">
      <div class="studio-hero__mark">CS</div>
      <h1>{{ t("mcp.title") }}</h1>
      <p>{{ t("mcp.heroDescription") }}</p>
    </div>

    <div class="studio-toolbar">
      <div class="studio-search">
        <label class="sr-only" for="mcp-search-input">{{ t("mcp.searchLabel") }}</label>
        <input
          id="mcp-search-input"
          :value="searchText"
          type="search"
          :placeholder="t('mcp.searchPlaceholder')"
          @input="$emit('update-search-text', $event.target.value)"
          @keydown.enter.prevent="$emit('search')"
        />
        <button
          class="studio-search-button"
          type="button"
          :aria-label="t('mcp.searchAction')"
          :title="t('mcp.searchAction')"
          @click="$emit('search')"
        >
          <span class="studio-icon studio-icon--search" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <div class="studio-tabs-row">
      <div class="studio-tabs" role="tablist" :aria-label="t('mcp.tabsLabel')">
        <button
          class="studio-tab"
          :class="{active: activeTab === 'all'}"
          type="button"
          @click="$emit('update-active-tab', 'all')"
        >
          {{ t("mcp.allConnectors") }}
        </button>
        <button
          class="studio-tab"
          :class="{active: activeTab === 'mine'}"
          type="button"
          @click="$emit('update-active-tab', 'mine')"
        >
          {{ t("mcp.myConnectors") }}
        </button>
      </div>
      <button
        class="studio-button studio-button--primary studio-create-entry"
        type="button"
        @click="$emit('open-create')"
      >
        {{ t("mcp.create") }}
      </button>
      <button
        class="studio-create-icon-entry"
        type="button"
        :aria-label="t('mcp.create')"
        :title="t('mcp.create')"
        @click="$emit('open-create')"
      >
        <span class="studio-icon studio-icon--plus" aria-hidden="true"></span>
      </button>
    </div>

    <div v-if="activeTab === 'all'" class="studio-category-chips" :aria-label="t('mcp.categoryLabel')">
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
      :aria-label="t('mcp.categorySelect')"
      @click="$emit('open-category-picker')"
    >
      <span>{{ activeCategoryLabel }}</span>
      <span class="studio-icon studio-icon--chevron-down" aria-hidden="true"></span>
    </button>

    <label v-if="activeTab === 'mine'" class="mcp-created-filter">
      <input
        :checked="createdOnly"
        type="checkbox"
        @change="$emit('update-created-only', $event.target.checked)"
      />
      <span>{{ t("mcp.createdOnly") }}</span>
    </label>

    <div class="studio-list-shell">
      <div ref="listAreaRef" class="studio-list-area">
        <div class="studio-grid">
          <ResourceCard
            v-for="mcp in mcps"
            :key="mcp.id"
            :item="mcp"
            :title="mcp.name"
            :subtitle="`${mcp.category} · ${mcp.model}`"
            :description="mcp.description"
            :meta="`${t('mcp.likes')} ${mcp.likes} · ${t('mcp.subscribers')} ${mcp.views}`"
            :image-text="mcp.initial"
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

    <nav class="studio-pagination" :aria-label="t('mcp.pagination.label')">
      <button class="studio-page-icon-button" type="button" :disabled="currentPage === 1" :aria-label="t('mcp.pagination.first')" @click="$emit('go-page', 1)">
        <span class="studio-icon studio-icon--page-first" aria-hidden="true"></span>
      </button>
      <button class="studio-page-icon-button" type="button" :disabled="currentPage === 1" :aria-label="t('mcp.pagination.previous')" @click="$emit('go-page', currentPage - 1)">
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
      <button class="studio-page-icon-button" type="button" :disabled="currentPage === maxPage" :aria-label="t('mcp.pagination.next')" @click="$emit('go-page', currentPage + 1)">
        <span class="studio-icon studio-icon--page-next" aria-hidden="true"></span>
      </button>
      <button class="studio-page-icon-button" type="button" :disabled="currentPage === maxPage" :aria-label="t('mcp.pagination.last')" @click="$emit('go-page', maxPage)">
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
const pageScrollRef = ref(null);
const listAreaRef = ref(null);

useOverlayScrollbar(pageScrollRef, {overflow: {x: "hidden", y: "scroll"}});
useOverlayScrollbar(listAreaRef, {overflow: {x: "hidden", y: "scroll"}});

defineProps({
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
