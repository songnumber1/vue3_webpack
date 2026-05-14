<!--
@file UserMenu.vue
@description Desktop user selector menu with guide, notices, personalization and language actions.
-->

<template>
  <div ref="menuRef" class="user-menu">
    <button
      class="user-menu-trigger"
      type="button"
      :aria-label="t('common.user')"
      @click="toggleOpen"
    >
      <span class="user-avatar user-avatar--header">민</span>
      <span class="user-menu-name">민우 송</span>
      <span class="user-menu-chevron">⌄</span>
    </button>

    <transition name="menu-pop">
      <section v-if="open" class="user-menu-panel" role="menu">
        <button class="user-menu-item" type="button" role="menuitem" @click="select('notice')">
          <strong>{{ t("common.notice") }}</strong>
          <small>{{ t("menu.noticeSummary") }}</small>
        </button>
        <button
          class="user-menu-item"
          type="button"
          role="menuitem"
          @click="select('personalization')"
        >
          <strong>{{ t("common.personalization") }}</strong>
          <small>{{ t("menu.personalizationSummary") }}</small>
        </button>
        <button class="user-menu-item" type="button" role="menuitem" @click="select('language')">
          <strong>{{ t("common.language") }}</strong>
          <small>{{ t("menu.languageSummary") }}</small>
        </button>
      </section>
    </transition>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const emit = defineEmits(["notice", "personalization", "language"]);
const { t } = useI18n();
const open = ref(false);
const menuRef = ref(null);

/**
 * Toggles the desktop user dropdown menu.
 * @returns {void}
 */
function toggleOpen() {
  open.value = !open.value;
}

/**
 * Emits a selected user-menu action and closes the menu.
 * @param {'notice'|'personalization'|'language'} action Selected action key.
 * @returns {void}
 */
function select(action) {
  open.value = false;
  emit(action);
}

/**
 * Closes the dropdown when the user clicks outside of the menu.
 * @param {MouseEvent} event Native click event.
 * @returns {void}
 */
function handleDocumentClick(event) {
  if (menuRef.value?.contains(event.target)) return;
  open.value = false;
}

onMounted(() => document.addEventListener("click", handleDocumentClick));
onBeforeUnmount(() => document.removeEventListener("click", handleDocumentClick));
</script>
