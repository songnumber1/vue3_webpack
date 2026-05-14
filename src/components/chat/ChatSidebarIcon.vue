<!--
@file ChatSidebarIcon.vue * @description Vue component used in the chat
web application runtime. * @author OpenAI
-->

<template>
  <component :is="bare ? 'svg' : 'span'" v-bind="rootAttrs">
    <svg
      v-if="!bare"
      class="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      v-html="pathMarkup"
    />
    <template v-else>
      <path v-for="(path, index) in paths" :key="index" v-bind="path" />
      <circle
        v-for="(circle, index) in circles"
        :key="`circle-${index}`"
        v-bind="circle"
      />
      <rect
        v-for="(rect, index) in rects"
        :key="`rect-${index}`"
        v-bind="rect"
      />
    </template>
  </component>
</template>

<script setup>
import { computed } from "vue";

const ICONS = {
  pencil: {
    markup:
      '<path d="M4 16.5V20h3.5L18.1 9.4 14.6 5.9 4 16.5Z"/><path d="M13.4 7.1 16.9 10.6"/>',
    paths: [
      { d: "M4 16.5V20h3.5L18.1 9.4 14.6 5.9 4 16.5Z" },
      { d: "M13.4 7.1 16.9 10.6" },
    ],
  },
  search: {
    markup: '<circle cx="10.5" cy="10.5" r="5.8"/><path d="M15 15 20 20"/>',
    circles: [{ cx: "10.5", cy: "10.5", r: "5.8" }],
    paths: [{ d: "M15 15 20 20" }],
  },
  panel: {
    markup:
      '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 4v16"/>',
    rects: [{ x: "4", y: "4", width: "16", height: "16", rx: "3" }],
    paths: [{ d: "M9 4v16" }],
  },
  chat: {
    markup:
      '<path d="M5 6.8A4 4 0 0 1 9 3h6a4 4 0 0 1 4 4v4.3a4 4 0 0 1-4 4H9.3L5 20v-4.7a4 4 0 0 1-1-2.7V6.8Z"/>',
    paths: [
      {
        d: "M5 6.8A4 4 0 0 1 9 3h6a4 4 0 0 1 4 4v4.3a4 4 0 0 1-4 4H9.3L5 20v-4.7a4 4 0 0 1-1-2.7V6.8Z",
      },
    ],
  },
};

const props = defineProps({
  /** @type {'pencil' | 'search' | 'panel' | 'chat'} */
  name: { type: String, required: true },
  /** true이면 wrapper 없이 svg 자체를 버튼 내부 아이콘으로 렌더링합니다. */
  bare: { type: Boolean, default: false },
});

const icon = computed(() => ICONS[props.name] || ICONS.chat);
const pathMarkup = computed(() => icon.value.markup);
const paths = computed(() => icon.value.paths || []);
const circles = computed(() => icon.value.circles || []);
const rects = computed(() => icon.value.rects || []);
const rootAttrs = computed(() =>
  props.bare
    ? {
        class: "nav-icon",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "aria-hidden": "true",
      }
    : { class: "icon-wrap" },
);
</script>
