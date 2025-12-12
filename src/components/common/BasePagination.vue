<template>
  <nav class="base-pagination" aria-label="Pagination">
    <button
      class="base-pagination__button"
      type="button"
      :disabled="currentPage === 1"
      @click="setPage(currentPage - 1)"
    >
      ‹
    </button>

    <button
      v-for="page in visiblePages"
      :key="page.key"
      class="base-pagination__button"
      :class="{ 'base-pagination__button--active': page.number === currentPage, 'base-pagination__button--ellipsis': page.ellipsis }"
      type="button"
      :disabled="page.ellipsis"
      @click="!page.ellipsis && setPage(page.number)"
    >
      {{ page.label }}
    </button>

    <button
      class="base-pagination__button"
      type="button"
      :disabled="currentPage === totalPages"
      @click="setPage(currentPage + 1)"
    >
      ›
    </button>

    <div class="base-pagination__meta" v-if="showMeta">
      {{ startItem }}–{{ endItem }} / {{ total }}
    </div>
  </nav>
</template>

<script>
export default {
  name: "BasePagination",
  props: {
    page: {
      type: Number,
      default: 1
    },
    pageSize: {
      type: Number,
      default: 10
    },
    total: {
      type: Number,
      default: 0
    },
    maxButtons: {
      type: Number,
      default: 5
    },
    showMeta: {
      type: Boolean,
      default: true
    }
  },
  emits: ["update:page"],
  computed: {
    totalPages() {
      return this.total > 0 ? Math.ceil(this.total / this.pageSize) : 1;
    },
    currentPage() {
      return Math.min(Math.max(this.page, 1), this.totalPages);
    },
    startItem() {
      if (this.total === 0) return 0;
      return (this.currentPage - 1) * this.pageSize + 1;
    },
    endItem() {
      return Math.min(this.currentPage * this.pageSize, this.total);
    },
    visiblePages() {
      const pages = [];
      const total = this.totalPages;
      const cur = this.currentPage;
      const max = this.maxButtons;

      if (total <= max + 2) {
        for (let i = 1; i <= total; i++) {
          pages.push({ key: i, number: i, ellipsis: false, label: i });
        }
        return pages;
      }

      pages.push({
        key: 1,
        number: 1,
        ellipsis: false,
        label: 1
      });

      let start = Math.max(2, cur - Math.floor(max / 2));
      let end = Math.min(total - 1, start + max - 1);
      if (end - start < max - 1) {
        start = Math.max(2, end - max + 1);
      }

      if (start > 2) {
        pages.push({
          key: "start-ellipsis",
          number: 0,
          ellipsis: true,
          label: "…"
        });
      }

      for (let i = start; i <= end; i++) {
        pages.push({
          key: i,
          number: i,
          ellipsis: false,
          label: i
        });
      }

      if (end < total - 1) {
        pages.push({
          key: "end-ellipsis",
          number: 0,
          ellipsis: true,
          label: "…"
        });
      }

      pages.push({
        key: total,
        number: total,
        ellipsis: false,
        label: total
      });

      return pages;
    }
  },
  methods: {
    setPage(p) {
      const page = Math.min(Math.max(p, 1), this.totalPages);
      this.$emit("update:page", page);
    }
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/components/basepagination.scss";
</style>
