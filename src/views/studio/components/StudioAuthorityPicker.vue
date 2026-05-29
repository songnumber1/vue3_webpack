<template>
  <div v-if="open" class="studio-picker-backdrop" @click.self="$emit('close')">
    <section class="studio-picker studio-picker--authority" role="dialog" aria-modal="true" aria-label="공개 대상 추가">
      <header class="studio-picker__head">
        <strong>공개 대상 추가</strong>
        <button type="button" @click="$emit('close')">×</button>
      </header>
      <div class="studio-picker__list">
        <button
          v-for="auth in authorities"
          :key="auth.deptId"
          class="studio-picker__option"
          type="button"
          @click="$emit('add', auth)"
        >
          <span>{{ auth.deptNameKo }}</span>
          <small>{{ auth.description }}</small>
        </button>
        <div v-if="!authorities.length" class="studio-picker__empty">추가 가능한 권한이 없습니다.</div>
      </div>
    </section>
  </div>
</template>

<script setup>
defineProps({
  open: {type: Boolean, default: false},
  authorities: {type: Array, default: () => []},
});
defineEmits(["close", "add"]);
</script>
