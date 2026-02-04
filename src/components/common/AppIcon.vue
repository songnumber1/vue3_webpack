<template>
  <svg
    class="app-icon"
    :class="[`size-${size}`, { muted }]"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- menu (hamburger) -->
    <template v-if="name === 'menu'">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </template>

    <!-- close (x) -->
    <template v-else-if="name === 'x'">
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </template>

    <!-- panel-left (sidebar) -->
    <template v-else-if="name === 'panel-left'">
      <path d="M4 4h16v16H4z" />
      <path d="M9 4v16" />
      <path d="M6.5 8h1.5" />
      <path d="M6.5 12h1.5" />
      <path d="M6.5 16h1.5" />
    </template>

    <!-- panel-right (collapsed indicator) -->
    <template v-else-if="name === 'panel-right'">
      <path d="M4 4h16v16H4z" />
      <path d="M15 4v16" />
      <path d="M16 8h1.5" />
      <path d="M16 12h1.5" />
      <path d="M16 16h1.5" />
    </template>

    <!-- chat -->
    <template v-else-if="name === 'chat'">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </template>

    <!-- beaker / lab -->
    <template v-else-if="name === 'beaker'">
      <path d="M10 2v6.2L5.6 18.5A2.5 2.5 0 0 0 7.9 22h8.2a2.5 2.5 0 0 0 2.3-3.5L14 8.2V2" />
      <path d="M8 12h8" />
    </template>

    <!-- trash -->
    <template v-else-if="name === 'trash'">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 16h10l1-16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </template>

    <!-- chevron left/right -->
    <template v-else-if="name === 'chevron-left'">
      <path d="M15 18l-6-6 6-6" />
    </template>
    <template v-else-if="name === 'chevron-right'">
      <path d="M9 18l6-6-6-6" />
    </template>

    <template v-else-if="name === 'chevron-down'">
      <path d="M6 9l6 6 6-6" />
    </template>

    <!-- send -->
    <template v-else-if="name === 'send'">
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4z" />
    </template>

    <!-- sidebar show/hide (distinct from collapse) -->
    <template v-else-if="name === 'sidebar-show'">
      <path d="M4 4h16v16H4z" />
      <path d="M9 4v16" />
      <path d="M13 12h6" />
      <path d="M16 9l3 3-3 3" />
    </template>
    <template v-else-if="name === 'sidebar-hide'">
      <path d="M4 4h16v16H4z" />
      <path d="M9 4v16" />
      <path d="M11 12h6" />
      <path d="M14 9l-3 3 3 3" />
    </template>

    <!-- sparkles (used for assistants) -->
    <template v-else-if="name === 'sparkles'">
      <path d="M12 2l1.2 3.6L17 7l-3.8 1.4L12 12l-1.2-3.6L7 7l3.8-1.4L12 2z" />
      <path d="M5 11l.8 2.4L8 14l-2.2.6L5 17l-.8-2.4L2 14l2.2-.6L5 11z" />
      <path d="M19 12l.8 2.4L22 15l-2.2.6L19 18l-.8-2.4L16 15l2.2-.6L19 12z" />
    </template>

    <!-- fallback: dot -->
    <template v-else>
      <circle cx="12" cy="12" r="1" />
    </template>
  </svg>
</template>

<script>
export default {
  name: "AppIcon",
  props: {
    name: { type: String, required: true },
    size: { type: String, default: "md" }, // xs|sm|md|lg
    muted: { type: Boolean, default: false },
  },
};
</script>

<style scoped>
.app-icon {
  display: inline-block;
  vertical-align: middle;
}

.app-icon.muted {
  color: var(--text-muted);
}

.size-xs {
  width: 14px;
  height: 14px;
}

.size-sm {
  width: 16px;
  height: 16px;
}

.size-md {
  width: 18px;
  height: 18px;
}

.size-lg {
  width: 20px;
  height: 20px;
}
</style>
