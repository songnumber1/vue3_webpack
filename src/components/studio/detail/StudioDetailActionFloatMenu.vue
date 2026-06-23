<template>
  <div v-if="open" class="studio-detail-viewer__menu" role="menu">
    <button type="button" role="menuitem" :disabled="disabled" @click="$emit('edit')">
      <span aria-hidden="true">✎</span>
      <span>{{ t("studio.detail.edit") }}</span>
    </button>
    <button
      class="studio-detail-viewer__menu-danger"
      type="button"
      role="menuitem"
      :disabled="disabled"
      @click="$emit('delete')"
    >
      <span aria-hidden="true">🗑</span>
      <span>{{ t("studio.detail.delete") }}</span>
    </button>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";

const {t} = useI18n();
defineProps({
  open: {type: Boolean, default: false},
  disabled: {type: Boolean, default: false},
});
defineEmits(["edit", "delete"]);
</script>

<style scoped lang="scss">
.studio-detail-viewer__menu {
  position: absolute;
  top: 42px;
  right: 48px;
  z-index: 4;
  min-width: 148px;
  overflow: hidden;
  border: 1px solid var(--studio-border, #e5e7eb);
  border-radius: 10px;
  background: var(--studio-surface, #fff);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.18);
}

.studio-detail-viewer__menu button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 11px 14px;
  text-align: left;
}

.studio-detail-viewer__menu button:hover {
  background: var(--studio-controlHover, #f3f4f6);
}

.studio-detail-viewer__menu-danger {
  color: #dc2626 !important;
}
</style>
