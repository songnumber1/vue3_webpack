<template>
  <teleport to="body">
    <transition :name="isMobile ? 'mobile-page' : 'modal-fade'">
      <div v-if="open" class="responsive-overlay" :class="overlayClasses">
        <div
          v-if="!isMobile"
          class="responsive-overlay-backdrop app-dialog-backdrop"
          @click="$emit('close')"
        ></div>
        <section
          class="responsive-panel app-dialog-panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header class="responsive-panel-header app-dialog-header">
            <button
              v-if="showMobileBackButton"
              class="responsive-back-button app-dialog-close"
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
              v-if="showCloseButton"
              class="responsive-close-button app-dialog-close"
              type="button"
              @click="$emit('close')"
            >
              ×
            </button>
          </header>
          <div class="responsive-panel-body app-dialog-body">
            <slot />
          </div>
        </section>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n();

const props = defineProps({
  open: {type: Boolean, default: false},
  isMobile: {type: Boolean, default: false},
  title: {type: String, required: true},
  subtitle: {type: String, default: ""},
  mobileMode: {
    type: String,
    default: "fullscreen",
    validator: (value) => ["fullscreen", "dialog"].includes(value),
  },
});

defineEmits(["close"]);

const isMobileFullscreen = computed(
  () => props.isMobile && props.mobileMode === "fullscreen"
);
const isMobileDialog = computed(
  () => props.isMobile && props.mobileMode === "dialog"
);

const overlayClasses = computed(() => ({
  "responsive-overlay--mobile": isMobileFullscreen.value,
  "responsive-overlay--mobile-dialog": isMobileDialog.value,
}));

const showMobileBackButton = computed(() => isMobileFullscreen.value);
const showCloseButton = computed(() => !isMobileFullscreen.value);
</script>

<style scoped>
/* Component-local styles should stay scoped. */
</style>
