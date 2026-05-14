<!--
@file IconButton.vue * @description Vue component used in the chat web
application runtime. * @author OpenAI
-->

<template>
  <button
    class="icon-button"
    :title="title"
    type="button"
    @click="$emit('click')"
  >
    <span>{{ icon }}</span>
  </button>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  title: { type: String, default: "" },
});
defineEmits(["click"]);
</script>
