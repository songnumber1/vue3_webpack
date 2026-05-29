<template>
  <div v-if="open" class="studio-picker-backdrop" @click.self="$emit('close')">
    <section class="studio-picker studio-picker--category" role="dialog" aria-modal="true" aria-label="카테고리 선택">
      <header class="studio-picker__head">
        <strong>카테고리 선택</strong>
        <button type="button" @click="$emit('close')">×</button>
      </header>
      <button
        v-for="category in categories"
        :key="category.value"
        class="studio-picker__option"
        :class="{active: selectedValue === category.value}"
        type="button"
        @click="$emit('select', category.value)"
      >
        <span>{{ category.label }}</span>
        <small>{{ category.description }}</small>
      </button>
    </section>
  </div>
</template>

<script setup>
defineProps({
  open: {type: Boolean, default: false},
  categories: {type: Array, default: () => []},
  selectedValue: {type: String, default: ""},
});
defineEmits(["close", "select"]);
</script>
