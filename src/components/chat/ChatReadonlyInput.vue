<template>
  <footer
    class="shared-readonly-wrap"
    :class="`shared-readonly-wrap--${variant}`"
    :aria-label="titleText"
  >
    <div class="shared-readonly-box" :class="`shared-readonly-box--${variant}`">
      <span class="shared-readonly-icon" aria-hidden="true">
        <img :src="readonlyIcon" alt="" />
      </span>
      <span class="shared-readonly-text">
        <strong>{{ titleText }}</strong>
        <span>{{ descriptionText }}</span>
      </span>
    </div>
  </footer>
</template>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import alertIcon from "@/assets/img/icons/alert.svg";
import lockIcon from "@/assets/img/icons/lock.svg";

const props = defineProps({
  variant: {type: String, default: "shared"},
  title: {type: String, default: ""},
  description: {type: String, default: ""},
});

const {t} = useI18n();

const readonlyIcon = computed(() =>
  props.variant === "deleted-model" ? alertIcon : lockIcon
);

const titleText = computed(() => {
  if (props.title) return props.title;
  if (props.variant === "deleted-model")
    return t("chat.readonlyInput.deletedModelTitle");
  if (props.variant === "unavailable-model")
    return t("chat.readonlyInput.unavailableModelTitle");
  return t("chat.sharedReadonly");
});

const descriptionText = computed(() => {
  if (props.description) return props.description;
  if (props.variant === "deleted-model")
    return t("chat.readonlyInput.deletedModelDesc");
  if (props.variant === "unavailable-model")
    return t("chat.readonlyInput.unavailableModelDesc");
  return t("chat.readonlyInput.sharedDesc");
});
</script>
