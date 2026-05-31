<template>
  <button
    :class="['resource-card tw-relative tw-flex tw-min-w-0 tw-rounded-studio tw-border tw-border-studio-border tw-bg-studio-surface tw-text-left tw-transition', cardClass]"
    type="button"
    @click="$emit('open', item)"
  >
    <span :class="imageClass">{{ imageText }}</span>
    <span v-if="showMore" :class="moreClass" aria-hidden="true">•••</span>
    <span :class="bodyClass">
      <strong>{{ title }}</strong>
      <small v-if="subtitle">{{ subtitle }}</small>
      <span v-if="description">{{ description }}</span>
    </span>
    <span v-if="meta" :class="metaClass">{{ meta }}</span>
  </button>
</template>

<script setup>
/**
 * Shared resource card used by Studio now and MCP later.
 *
 * The component is intentionally presentational. It receives display strings from
 * the caller and emits the original item on selection, so Studio/MCP state and
 * routing ownership stays outside this reusable card.
 */
defineProps({
  item: {type: Object, required: true},
  title: {type: String, required: true},
  subtitle: {type: String, default: ""},
  description: {type: String, default: ""},
  meta: {type: String, default: ""},
  imageText: {type: String, default: ""},
  showMore: {type: Boolean, default: true},
  cardClass: {type: [String, Array, Object], default: ""},
  imageClass: {type: [String, Array, Object], default: "resource-card__image tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-studio tw-bg-studio-primary tw-text-app-textOnPrimary"},
  bodyClass: {type: [String, Array, Object], default: "resource-card__body tw-min-w-0 tw-flex-1"},
  moreClass: {type: [String, Array, Object], default: "resource-card__more tw-absolute tw-inline-flex tw-items-center tw-justify-center"},
  metaClass: {type: [String, Array, Object], default: "resource-card__meta tw-text-xs tw-text-studio-muted"},
});

defineEmits(["open"]);
</script>
