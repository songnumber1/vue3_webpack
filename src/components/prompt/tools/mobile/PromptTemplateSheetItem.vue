<template>
  <button
    class="bottom-sheet-option bottom-sheet-option--row bottom-sheet-option--template tw-flex tw-w-full tw-items-center tw-gap-2.5 tw-text-left"
    :class="{'is-active': active}"
    type="button"
    @click="$emit('select')"
  >
    <img
      v-if="iconSrc"
      class="bottom-sheet-tool-icon tw-h-[22px] tw-w-[22px] tw-shrink-0 tw-object-contain"
      :src="iconSrc"
      alt=""
      aria-hidden="true"
    />
    <span
      class="bottom-sheet-option-main tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-start tw-text-left"
    >
      <strong>{{ label }}</strong>
      <small v-if="description">{{ description }}</small>
    </span>
  </button>
</template>

<script setup>
defineProps({
  label: {type: String, required: true},
  description: {type: String, default: ""},
  iconSrc: {type: String, default: ""},
  active: {type: Boolean, default: false},
});

defineEmits(["select"]);
</script>
