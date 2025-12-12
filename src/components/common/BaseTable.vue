<template>
  <div class="base-table__wrapper">
    <table class="base-table">
      <thead :class="{ 'base-table__head--sticky': stickyHeader }">
        <tr>
          <th v-if="selectable" class="base-table__cell base-table__cell--head">
            <input
              type="checkbox"
              :checked="allSelected"
              @change="toggleAll"
            />
          </th>
          <th
            v-for="col in displayedColumns"
            :key="col.key"
            class="base-table__cell base-table__cell--head"
            :class="{ 'base-table__cell--sortable': col.sortable }"
            @click="col.sortable && toggleSort(col.key)"
          >
            <span>{{ col.label }}</span>
            <span v-if="col.sortable" class="base-table__sort-icon">
              <span v-if="sortKey === col.key">
                {{ sortDir === 'asc' ? '▲' : '▼' }}
              </span>
              <span v-else>⇅</span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in pagedRows"
          :key="rowKey ? row[rowKey] : row.__idx"
          class="base-table__row"
        >
          <td
            v-if="selectable"
            class="base-table__cell base-table__cell--body"
          >
            <input
              type="checkbox"
              :checked="isSelected(row)"
              @change="toggleRow(row)"
            />
          </td>
          <td
            v-for="col in displayedColumns"
            :key="col.key"
            class="base-table__cell base-table__cell--body"
          >
            <slot :name="`cell-${col.key}`" :row="row">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
        <tr v-if="!pagedRows.length">
          <td
            :colspan="displayedColumns.length + (selectable ? 1 : 0)"
            class="base-table__empty"
          >
            데이터가 없습니다.
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showPagination" class="base-table__pagination">
      <BasePagination
        v-model:page="localPage"
        :page-size="pageSize"
        :total="sortedRows.length"
      />
    </div>
  </div>
</template>

<script>
import BasePagination from "./BasePagination.vue";
import responsiveManager from "@/plugins/responsiveManager";

export default {
  name: "BaseTable",
  components: { BasePagination },
  props: {
    columns: {
      type: Array,
      default: () => []
    },
    rows: {
      type: Array,
      default: () => []
    },
    rowKey: {
      type: String,
      default: ""
    },
    selectable: {
      type: Boolean,
      default: false
    },
    selectedRowKeys: {
      type: Array,
      default: () => []
    },
    stickyHeader: {
      type: Boolean,
      default: false
    },
    pageSize: {
      type: Number,
      default: 5
    },
    showPagination: {
      type: Boolean,
      default: true
    },
    /**
     * sm 화면에서 보여줄 컬럼 key 목록 (없으면 모든 컬럼 사용, hideAt으로 제어)
     */
    smVisibleColumns: {
      type: Array,
      default: () => []
    }
  },
  emits: ["update:selectedRowKeys", "update:page"],
  data() {
    return {
      sortKey: null,
      sortDir: "asc",
      localPage: 1,
      currentBp: "lg",
      unsubscribe: null
    };
  },
  computed: {
    rowsWithIndex() {
      return this.rows.map((r, idx) => ({ ...r, __idx: idx }));
    },
    sortedRows() {
      if (!this.sortKey) return this.rowsWithIndex;
      const dir = this.sortDir === "asc" ? 1 : -1;
      return [...this.rowsWithIndex].sort((a, b) => {
        const av = a[this.sortKey];
        const bv = b[this.sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (av === bv) return 0;
        return av > bv ? dir : -dir;
      });
    },
    pagedRows() {
      if (!this.showPagination) return this.sortedRows;
      const start = (this.localPage - 1) * this.pageSize;
      return this.sortedRows.slice(start, start + this.pageSize);
    },
    allSelected() {
      if (!this.selectable || !this.rows.length) return false;
      return this.rows.every((r) => this.isSelected(r));
    },
    displayedColumns() {
      const cols = this.columns || [];
      return cols.filter((col) => {
        if (!col) return false;
        const hideAt = col.hideAt || [];
        if (hideAt.includes(this.currentBp)) return false;

        if (this.currentBp === "sm" && this.smVisibleColumns.length > 0) {
          return this.smVisibleColumns.includes(col.key);
        }

        return true;
      });
    }
  },
  watch: {
    rows() {
      this.localPage = 1;
    }
  },
  mounted() {
    this.unsubscribe = responsiveManager.subscribe((state) => {
      this.currentBp = state.bp;
    });
  },
  beforeUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },
  methods: {
    toggleSort(key) {
      if (this.sortKey === key) {
        this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
      } else {
        this.sortKey = key;
        this.sortDir = "asc";
      }
    },
    isSelected(row) {
      if (!this.rowKey) return false;
      return this.selectedRowKeys.includes(row[this.rowKey]);
    },
    toggleRow(row) {
      if (!this.rowKey) return;
      const key = row[this.rowKey];
      const exists = this.selectedRowKeys.includes(key);
      const next = exists
        ? this.selectedRowKeys.filter((k) => k !== key)
        : [...this.selectedRowKeys, key];
      this.$emit("update:selectedRowKeys", next);
    },
    toggleAll(e) {
      if (e.target.checked) {
        const keys = this.rows.map((r) =>
          this.rowKey ? r[this.rowKey] : r.__idx
        );
        this.$emit("update:selectedRowKeys", keys);
      } else {
        this.$emit("update:selectedRowKeys", []);
      }
    }
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/components/basetable.scss";
</style>
