<template>
  <component :is="bare ? 'img' : 'span'" v-bind="rootAttrs">
    <img
      v-if="!bare"
      class="nav-icon"
      :src="iconSrc"
      alt=""
      aria-hidden="true"
    />
  </component>
</template>

<script setup>
import {computed} from "vue";
import pencilIcon from "@/assets/img/navigation/pencil.svg";
import searchIcon from "@/assets/img/navigation/search.svg";
import panelIcon from "@/assets/img/navigation/panel.svg";
import chatIcon from "@/assets/img/navigation/chat.svg";

const ICONS = {
  pencil: pencilIcon,
  search: searchIcon,
  panel: panelIcon,
  chat: chatIcon,
};

const props = defineProps({
  name: {type: String, required: true},
  bare: {type: Boolean, default: false},
});

const iconSrc = computed(() => ICONS[props.name] || ICONS.chat);
const rootAttrs = computed(() =>
  props.bare
    ? {
        class: "nav-icon",
        src: iconSrc.value,
        alt: "",
        "aria-hidden": "true",
      }
    : {class: "icon-wrap"}
);
</script>
