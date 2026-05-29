<template>
  <div class="studio-workspace__scroll">
    <div class="studio-hero">
      <div class="studio-hero__mark">AS</div>
      <h1>Assistant Studio</h1>
      <p>다양한 추가 지식과 기능을 활용한 맞춤형 Assistant를 탐색하고 직접 만들 수 있습니다.</p>
    </div>

    <div class="studio-toolbar">
      <div class="studio-search">
        <label class="sr-only" for="studio-search-input">Assistant Studio 검색</label>
        <input
          id="studio-search-input"
          :value="searchText"
          type="search"
          placeholder="Assistant 검색"
          @input="$emit('update-search-text', $event.target.value)"
          @keydown.enter.prevent="$emit('search')"
        />
        <button class="studio-search-button" type="button" aria-label="검색" title="검색" @click="$emit('search')">
          <span class="studio-icon studio-icon--search" aria-hidden="true"></span>
        </button>
      </div>
    </div>

    <div class="studio-tabs-row">
      <div class="studio-tabs" role="tablist" aria-label="Assistant Studio 목록 유형">
        <button class="studio-tab" :class="{active: activeTab === 'all'}" type="button" @click="$emit('update-active-tab', 'all')">Assistant 목록</button>
        <button class="studio-tab" :class="{active: activeTab === 'mine'}" type="button" @click="$emit('update-active-tab', 'mine')">나의 Assistant</button>
      </div>
      <button class="studio-button studio-button--primary studio-create-entry" type="button" @click="$emit('open-create')">Assistant 만들기</button>
      <button class="studio-create-icon-entry" type="button" aria-label="Assistant 만들기" title="Assistant 만들기" @click="$emit('open-create')">
        <span class="studio-icon studio-icon--plus" aria-hidden="true"></span>
      </button>
    </div>

    <div v-if="activeTab === 'all'" class="studio-category-chips" aria-label="Assistant Studio 카테고리">
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
      aria-label="카테고리 선택"
      @click="$emit('open-category-picker')"
    >
      <span>{{ activeCategoryLabel }}</span>
      <span class="studio-icon studio-icon--chevron-down" aria-hidden="true"></span>
    </button>

    <div class="studio-list-shell">
      <div class="studio-list-area">
        <div class="studio-grid">
          <button v-for="studio in studios" :key="studio.id" class="studio-card" type="button" @click="$emit('open-detail', studio)">
            <span class="studio-card__image">{{ studio.initial }}</span>
            <span class="studio-card__more" aria-hidden="true">•••</span>
            <span class="studio-card__body">
              <strong>{{ studio.name }}</strong>
              <small>{{ studio.category }} · {{ studio.model }}</small>
              <span>{{ studio.description }}</span>
            </span>
            <span class="studio-card__meta">좋아요 {{ studio.likes }} · 질문 {{ studio.views }}</span>
          </button>
        </div>
      </div>
    </div>

    <nav class="studio-pagination" aria-label="Assistant Studio pagination">
        <button class="studio-page-icon-button" type="button" :disabled="currentPage === 1" aria-label="첫 페이지" @click="$emit('go-page', 1)">
          <span class="studio-icon studio-icon--page-first" aria-hidden="true"></span>
        </button>
        <button class="studio-page-icon-button" type="button" :disabled="currentPage === 1" aria-label="이전 페이지" @click="$emit('go-page', currentPage - 1)">
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
        <button class="studio-page-icon-button" type="button" :disabled="currentPage === maxPage" aria-label="다음 페이지" @click="$emit('go-page', currentPage + 1)">
          <span class="studio-icon studio-icon--page-next" aria-hidden="true"></span>
        </button>
        <button class="studio-page-icon-button" type="button" :disabled="currentPage === maxPage" aria-label="마지막 페이지" @click="$emit('go-page', maxPage)">
          <span class="studio-icon studio-icon--page-last" aria-hidden="true"></span>
        </button>
      </nav>
  </div>
</template>

<script setup>
defineProps({
  searchText: {type: String, default: ""},
  activeTab: {type: String, default: "all"},
  activeCategory: {type: String, default: "ALL"},
  activeCategoryLabel: {type: String, default: "전체"},
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
