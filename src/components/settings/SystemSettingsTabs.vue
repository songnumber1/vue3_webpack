<template>
  <div class="system-settings-tabs-row">
    <div
      class="studio-tabs system-settings-tabs"
      role="tablist"
      :aria-label="t('systemSettings.tabsLabel')"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="studio-tab system-settings-tab"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.key"
        :class="{'is-active': activeTab === tab.key}"
        @click="$emit('change', tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";

defineProps({
  tabs: {type: Array, default: () => []},
  activeTab: {type: String, default: ""},
});

defineEmits(["change"]);

const {t} = useI18n();
</script>
