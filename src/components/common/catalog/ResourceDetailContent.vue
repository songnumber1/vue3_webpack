<template>
  <div :class="['resource-detail-content', contentClass]">
    <header :class="headClass">
      <div :class="imageClass">{{ imageText }}</div>
      <div>
        <h2>{{ title }}</h2>
        <p>{{ meta }}</p>
      </div>
    </header>
    <p v-if="description" :class="descriptionClass">{{ description }}</p>

    <h3>{{ labels.prompts }}</h3>
    <div :class="promptGridClass">
      <button v-for="prompt in prompts" :key="prompt" type="button">{{ prompt }}</button>
    </div>

    <h3>{{ labels.knowledge }}</h3>
    <p :class="boxClass">{{ knowledge }}</p>

    <h3>{{ labels.scope }}</h3>
    <p :class="boxClass">{{ scope }}</p>
  </div>
</template>

<script setup>
/**
 * Shared detail body for catalog-like resources.
 * Studio wraps this component today; MCP can reuse it with different labels/data.
 */
defineProps({
  title: {type: String, required: true},
  meta: {type: String, default: ""},
  description: {type: String, default: ""},
  imageText: {type: String, default: ""},
  prompts: {type: Array, default: () => []},
  knowledge: {type: String, default: ""},
  scope: {type: String, default: ""},
  labels: {
    type: Object,
    default: () => ({prompts: "Prompts", knowledge: "Knowledge", scope: "Scope"}),
  },
  contentClass: {type: [String, Array, Object], default: ""},
  headClass: {type: [String, Array, Object], default: "resource-detail-content__head"},
  imageClass: {type: [String, Array, Object], default: "resource-detail-content__image"},
  descriptionClass: {type: [String, Array, Object], default: "resource-detail-content__description"},
  promptGridClass: {type: [String, Array, Object], default: "resource-detail-content__prompt-grid"},
  boxClass: {type: [String, Array, Object], default: "resource-detail-content__box"},
});
</script>
