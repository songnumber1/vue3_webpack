<template>
  <div class="studio-multi-select">
    <button class="studio-multi-select__trigger" type="button" @click="open = true">
      <span class="studio-multi-select__title">{{ title }}</span>
      <span v-if="modelValue.length" class="studio-multi-select__chips">
        <span v-for="item in visibleValues" :key="item" class="studio-multi-select__chip">{{ item }}</span>
        <span v-if="hiddenCount > 0" class="studio-multi-select__chip">+{{ hiddenCount }}</span>
      </span>
      <strong v-else>0개 선택</strong>
      <span class="studio-multi-select__chevron" aria-hidden="true">⌄</span>
    </button>
    <div v-if="open" class="studio-multi-select__panel">
      <div class="studio-multi-select__head">
        <strong>{{ title }}</strong>
        <button type="button" @click="open = false">×</button>
      </div>
      <label v-for="option in options" :key="option" class="studio-multi-select__option">
        <input type="checkbox" :checked="modelValue.includes(option)" @change="toggle(option)" />
        <span>{{ option }}</span>
      </label>
      <button class="studio-button studio-button--primary" type="button" @click="open = false">적용</button>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from "vue";
const props = defineProps({
  modelValue: {type: Array, default: () => []},
  title: {type: String, required: true},
  options: {type: Array, default: () => []},
});
const emit = defineEmits(["update:modelValue"]);
const open = ref(false);
const visibleValues = computed(() => props.modelValue.slice(0, 2));
const hiddenCount = computed(() => Math.max(0, props.modelValue.length - visibleValues.value.length));
function toggle(option) {
  const next = props.modelValue.includes(option)
    ? props.modelValue.filter((item) => item !== option)
    : [...props.modelValue, option];
  emit("update:modelValue", next);
}
</script>
