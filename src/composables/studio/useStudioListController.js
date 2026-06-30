export function useStudioListController(options = {}) {
  return {
    searchText: options.searchText,
    activeTab: options.activeTab,
    activeCategory: options.activeCategory,
    activeCategoryLabel: options.activeCategoryLabel,
    studios: options.studios,
    pages: options.pages,
    currentPage: options.currentPage,
    maxPage: options.maxPage,
    updateSearchText: options.updateSearchText,
    runSearch: options.runSearch,
    updateActiveTab: options.updateActiveTab,
    openCategoryPicker: options.openCategoryPicker,
    openCreate: options.openCreate,
    openDetail: options.openDetail,
    goPage: options.goPage,
  };
}
