<!--
@file ResponsiveOverlay.vue
@description Responsive modal that becomes a full-screen Android-style page on mobile.
-->

<template>
  <teleport to="body">
    <transition :name="isMobile ? 'mobile-page' : 'modal-fade'">
      <div
        v-if="open"
        class="responsive-overlay"
        :class="{ 'responsive-overlay--mobile': isMobile }"
      >
        <div
          v-if="!isMobile"
          class="responsive-overlay-backdrop"
          @click="$emit('close')"
        ></div>
        <section
          class="responsive-panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header class="responsive-panel-header">
            <button
              v-if="isMobile"
              class="responsive-back-button"
              type="button"
              @click="$emit('close')"
            >
              <span aria-hidden="true">‹</span>
              <span class="sr-only">{{ t("common.back") }}</span>
            </button>
            <div>
              <strong>{{ title }}</strong>
              <small v-if="subtitle">{{ subtitle }}</small>
            </div>
            <button
              v-if="!isMobile"
              class="responsive-close-button"
              type="button"
              @click="$emit('close')"
            >
              ×
            </button>
          </header>
          <div class="responsive-panel-body">
            <slot />
          </div>
        </section>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps({
  open: { type: Boolean, default: false },
  isMobile: { type: Boolean, default: false },
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
});

defineEmits(["close"]);
</script>
