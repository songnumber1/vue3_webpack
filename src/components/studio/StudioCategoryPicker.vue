<template>
  <StudioCategoryBottomSheet
    :open="open"
    :categories="categories"
    :selected-value="selectedValue"
    @close="$emit('close')"
    @select="$emit('select', $event)"
  />
</template>

<script setup>
import StudioCategoryBottomSheet from "@/components/studio/select/StudioCategoryBottomSheet.vue";

defineProps({
  open: {type: Boolean, default: false},
  categories: {type: Array, default: () => []},
  selectedValue: {type: String, default: ""},
});
defineEmits(["close", "select"]);
</script>
