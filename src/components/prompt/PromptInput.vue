<!--
@file PromptInput.vue
@description Responsive prompt input facade. It chooses a desktop or mobile wrapper while keeping the public component API stable.
-->
<template>
  <component :is="component" v-bind="$attrs" />
</template>

<script setup>
import {computed} from "vue";
import DesktopPromptInput from "./DesktopPromptInput.vue";
import MobilePromptInput from "./MobilePromptInput.vue";

defineOptions({inheritAttrs: false});

const props = defineProps({
  isMobile: {type: Boolean, default: false},
});

const component = computed(() =>
  props.isMobile ? MobilePromptInput : DesktopPromptInput
);
</script>
