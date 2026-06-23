<template>
  <article
    class="studio-mobile-page studio-mobile-page--detail tw-flex tw-min-h-0 tw-flex-col tw-bg-studio-bg tw-text-studio-text"
    :aria-label="t('mcp.detail.title')"
  >
    <header
      class="studio-mobile-page__head studio-mobile-page__head--notice tw-shrink-0 tw-items-center"
    >
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
    <div
      ref="contentRef"
      class="studio-mobile-page__content tw-min-h-0 tw-flex-1 tw-overflow-y-auto"
    >
      <McpInfoPanel :mcp="mcp" />
    </div>
  </article>
</template>

<script setup>
import {ref} from "vue";
import {useI18n} from "vue-i18n";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import McpInfoPanel from "@/components/mcp/McpInfoPanel.vue";
const {t} = useI18n();
const {shouldUseOverlayScrollbar} = useOverlayScrollPolicy();
const contentRef = ref(null);
useOverlayScrollbar(contentRef, {overflow: {x: "hidden", y: "scroll"}}, {
  enabled: () => shouldUseOverlayScrollbar.value,
});
defineProps({mcp: {type: Object, required: true}});
defineEmits(["close"]);
</script>
