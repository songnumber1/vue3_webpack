<template>
  <BaseBottomSheet
    :open="mobileOpen"
    :title="targetTitle"
    initial-snap="content"
    :min-height="280"
    @close="$emit('close')"
  >
    <div class="chat-history-sheet-options">
      <button
        v-for="action in actions"
        :key="action.key"
        class="bottom-sheet-option chat-history-action-option"
        :class="{'chat-history-action-option--danger': action.danger}"
        type="button"
        @click="$emit('select', action.key)"
      >
        <span aria-hidden="true">{{ action.icon }}</span>
        <strong>{{ action.label }}</strong>
      </button>
    </div>
  </BaseBottomSheet>

  <teleport to="body">
    <div
      v-if="desktopOpen"
      ref="menuRef"
      class="chat-history-context-menu-shell"
      :style="contextMenuStyle"
    >
      <transition name="context-menu-fade">
        <div
          v-show="positionReady"
          class="chat-history-context-menu"
          role="menu"
        >
          <button
            v-for="action in actions"
            :key="action.key"
            class="chat-history-context-menu__item"
            :class="{'chat-history-context-menu__item--danger': action.danger}"
            type="button"
            role="menuitem"
            @click="$emit('select', action.key)"
          >
            <span aria-hidden="true">{{ action.icon }}</span>
            <span>{{ action.label }}</span>
          </button>
        </div>
      </transition>
    </div>
  </teleport>
</template>

<script setup>
import {computed, nextTick, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {autoUpdate, flip, offset, shift, useFloating} from "@floating-ui/vue";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";

const props = defineProps({
  open: {type: Boolean, default: false},
  isMobile: {type: Boolean, default: false},
  target: {type: Object, default: null},
  referenceEl: {type: Object, default: null},
});

defineEmits(["close", "select"]);
const {t} = useI18n();
const menuRef = ref(null);
const referenceRef = computed(() => props.referenceEl || null);

const {floatingStyles, update, x, y} = useFloating(referenceRef, menuRef, {
  placement: "right-start",
  strategy: "fixed",
  transform: false,
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(8),
    flip({fallbackPlacements: ["left-start", "bottom-end"]}),
    shift({padding: 12}),
  ],
});

const mobileOpen = computed(() => props.open && props.isMobile);
const desktopOpen = computed(() => props.open && !props.isMobile);
const positionReady = ref(false);
const hasMeasuredPosition = computed(
  () => Number.isFinite(x.value) && Number.isFinite(y.value)
);
const contextMenuStyle = computed(() => {
  const ready =
    desktopOpen.value && positionReady.value && hasMeasuredPosition.value;
  return {
    ...floatingStyles.value,
    position: "fixed",
    visibility: ready ? "visible" : "hidden",
    pointerEvents: ready ? "auto" : "none",
  };
});
const targetTitle = computed(
  () => props.target?.title || t("chat.historyMenu.title")
);
const actions = computed(() => {
  const pinAction = props.target?.isPinned
    ? {key: "unpin", label: t("chat.historyMenu.unpin"), icon: "☆"}
    : {key: "pin", label: t("chat.historyMenu.pin"), icon: "★"};
  return [
    pinAction,
    {key: "rename", label: t("chat.historyMenu.rename"), icon: "✎"},
    {key: "share", label: t("chat.historyMenu.share"), icon: "↗"},
    {
      key: "delete",
      label: t("chat.historyMenu.delete"),
      icon: "🗑",
      danger: true,
    },
  ];
});

watch(
  () => [desktopOpen.value, props.referenceEl],
  async () => {
    positionReady.value = false;
    if (!desktopOpen.value) return;
    await nextTick();
    await update?.();
    await nextTick();
    await update?.();
    positionReady.value = hasMeasuredPosition.value;
  },
  {flush: "post"}
);

defineExpose({menuRef});
</script>
