<template>
  <button
    :class="['resource-card', cardClass]"
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
  imageClass: {type: [String, Array, Object], default: "resource-card__image"},
  bodyClass: {type: [String, Array, Object], default: "resource-card__body"},
  moreClass: {type: [String, Array, Object], default: "resource-card__more"},
  metaClass: {type: [String, Array, Object], default: "resource-card__meta"},
});

defineEmits(["open"]);
</script>
