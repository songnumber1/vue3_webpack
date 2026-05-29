<template>
  <div v-if="open" class="studio-picker-backdrop" @click.self="$emit('close')">
    <section class="studio-picker studio-picker--authority" role="dialog" aria-modal="true" :aria-label="t('studio.share.pickerTitle')">
      <header class="studio-picker__head">
        <strong>{{ t('studio.share.pickerTitle') }}</strong>
        <button type="button" :aria-label="t('common.close')" @click="$emit('close')">×</button>
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
        <div v-if="!authorities.length" class="studio-picker__empty">{{ t('studio.share.pickerEmpty') }}</div>
      </div>
    </section>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";
const {t} = useI18n();

defineProps({
  open: {type: Boolean, default: false},
  authorities: {type: Array, default: () => []},
});
defineEmits(["close", "add"]);
</script>
