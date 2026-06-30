export function useMcpListController(options = {}) {
  return {
    searchText: options.searchText,
    activeTab: options.activeTab,
    activeCategory: options.activeCategory,
    activeCategoryLabel: options.activeCategoryLabel,
    createdOnly: options.createdOnly,
    mcps: options.mcps,
    pages: options.pages,
    currentPage: options.currentPage,
    maxPage: options.maxPage,
    updateSearchText: options.updateSearchText,
    runSearch: options.runSearch,
    updateActiveTab: options.updateActiveTab,
    updateCreatedOnly: options.updateCreatedOnly,
    openCategoryPicker: options.openCategoryPicker,
    openCreate: options.openCreate,
    openDetail: options.openDetail,
    goPage: options.goPage,
  };
}
