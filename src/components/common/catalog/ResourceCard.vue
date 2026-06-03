<template>
  <button
    :class="[
      'resource-card tw-relative tw-min-w-0 tw-border-solid tw-text-left tw-transition',
      cardClass,
    ]"
    type="button"
    @click="$emit('open', item)"
  >
    <span :class="imageClass">{{ imageText }}</span>
    <span v-if="showMore" :class="moreClass" aria-hidden="true">•••</span>
    <span :class="bodyClass">
      <strong>{{ title }}</strong>
      <small v-if="subtitle" class="tw-text-studio-muted">{{ subtitle }}</small>
      <span v-if="description" class="tw-text-studio-muted">{{
        description
      }}</span>
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
  imageClass: {
    type: [String, Array, Object],
    default:
      "resource-card__image tw-inline-flex tw-h-[52px] tw-w-[52px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-studio tw-bg-studio-primary tw-font-extrabold tw-text-app-textOnPrimary",
  },
  bodyClass: {
    type: [String, Array, Object],
    default: "resource-card__body tw-grid tw-min-w-0 tw-gap-[5px]",
  },
  moreClass: {
    type: [String, Array, Object],
    default:
      "resource-card__more tw-absolute tw-right-[14px] tw-top-3 tw-inline-flex tw-items-center tw-justify-center tw-text-studio-muted tw-font-black tw-tracking-[1px]",
  },
  metaClass: {
    type: [String, Array, Object],
    default:
      "resource-card__meta tw-col-span-full tw-text-xs tw-text-studio-muted",
  },
});

defineEmits(["open"]);
</script>
