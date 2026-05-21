<template>
  <component :is="bare ? 'img' : 'span'" v-bind="rootAttrs">
    <img v-if="!bare" class="nav-icon" :src="iconSrc" alt="" aria-hidden="true" />
  </component>
</template>

<script setup>
import {computed} from "vue";
import navChatIcon from "@/assets/img/icons/nav-chat.svg";
import navPanelIcon from "@/assets/img/icons/nav-panel.svg";
import navPencilIcon from "@/assets/img/icons/nav-pencil.svg";
import navSearchIcon from "@/assets/img/icons/nav-search.svg";

const ICONS = {
  pencil: navPencilIcon,
  search: navSearchIcon,
  panel: navPanelIcon,
  chat: navChatIcon,
};

const props = defineProps({
  name: {type: String, required: true},
  bare: {type: Boolean, default: false},
});

const iconSrc = computed(() => ICONS[props.name] || ICONS.chat);
const rootAttrs = computed(() =>
  props.bare
    ? {class: "nav-icon", src: iconSrc.value, alt: "", "aria-hidden": "true"}
    : {class: "icon-wrap"}
);
</script>
