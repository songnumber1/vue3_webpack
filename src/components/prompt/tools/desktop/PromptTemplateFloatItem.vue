<template>
  <button
    type="button"
    class="is-template-tool tw-flex tw-w-full tw-items-center tw-gap-2.5 tw-rounded-controlSm tw-px-2.5 tw-text-left"
    :class="{active}"
    :title="label"
    :aria-label="label"
    @click="$emit('select')"
  >
    <img
      v-if="iconSrc"
      class="prompt-tool-icon-img tw-h-[18px] tw-w-[18px] tw-shrink-0 tw-object-contain"
      :src="iconSrc"
      alt=""
      aria-hidden="true"
    />
    <span
      class="prompt-tool-text tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-text-left"
    >
      <strong>{{ label }}</strong>
    </span>
  </button>
</template>

<script setup>
defineProps({
  label: {type: String, required: true},
  iconSrc: {type: String, default: ""},
  active: {type: Boolean, default: false},
});

defineEmits(["select"]);
</script>
