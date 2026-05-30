<template>
  <article
    class="studio-mobile-page studio-mobile-page--detail"
    :aria-label="t('mcp.detail.title')"
  >
    <header class="studio-mobile-page__head studio-mobile-page__head--notice">
      <button
        class="studio-mobile-page__back"
        type="button"
        :aria-label="t('common.back')"
        @click="$emit('close')"
      >
        ‹
      </button>
      <strong>{{ mcp.name }}</strong>
      <button
        class="studio-mobile-page__close"
        type="button"
        :aria-label="t('common.close')"
        @click="$emit('close')"
      >
        ×
      </button>
    </header>
    <div class="studio-mobile-page__content">
      <McpDetailContent :mcp="mcp" />
    </div>
  </article>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import McpDetailContent from "@/components/mcp/McpDetailContent.vue";
const {t} = useI18n();
defineProps({mcp: {type: Object, required: true}});
defineEmits(["close"]);
</script>
