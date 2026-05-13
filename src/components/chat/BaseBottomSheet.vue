<template>
  <teleport to="body">
    <transition name="sheet-fade">
      <div v-if="open" class="bottom-sheet-backdrop" @click="$emit('close')"></div>
    </transition>
    <transition name="sheet-slide">
      <section
        v-if="open"
        class="bottom-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div class="bottom-sheet-handle" aria-hidden="true"></div>
        <header class="bottom-sheet-header">
          <h2>{{ title }}</h2>
          <button type="button" class="bottom-sheet-close" aria-label="닫기" @click="$emit('close')">×</button>
        </header>
        <div class="bottom-sheet-body">
          <slot />
        </div>
      </section>
    </transition>
  </teleport>
</template>

<script setup>
defineProps({
  open: {type: Boolean, default: false},
  title: {type: String, default: '선택'},
});

defineEmits(['close']);
</script>
