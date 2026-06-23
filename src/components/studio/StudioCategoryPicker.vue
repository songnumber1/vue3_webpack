<template>
  <StudioCategoryBottomSheet
    v-if="isMobile"
    :open="open"
    :categories="categories"
    :selected-value="selectedValue"
    @close="$emit('close')"
    @select="$emit('select', $event)"
  />

  <StudioCategoryDialog
    v-else
    :open="open"
    :categories="categories"
    :selected-value="selectedValue"
    @close="$emit('close')"
    @select="$emit('select', $event)"
  />
</template>

<script setup>
import {computed} from "vue";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
import StudioCategoryBottomSheet from "@/components/studio/select/StudioCategoryBottomSheet.vue";
import StudioCategoryDialog from "@/components/studio/select/StudioCategoryDialog.vue";

defineProps({
  open: {type: Boolean, default: false},
  categories: {type: Array, default: () => []},
  selectedValue: {type: String, default: ""},
});
defineEmits(["close", "select"]);
const responsiveContext = useResponsiveContext();
const isMobile = computed(() => responsiveContext.value.isMobile);
</script>
