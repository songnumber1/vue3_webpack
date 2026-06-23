<template>
  <teleport to="body">
    <div
      v-if="open"
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
            class="chat-history-context-menu__item"
            type="button"
            role="menuitem"
            @click="$emit('select', pinActionKey)"
          >
            <span aria-hidden="true">{{ pinActionIcon }}</span>
            <span>{{ pinActionLabel }}</span>
          </button>
          <button
            class="chat-history-context-menu__item"
            type="button"
            role="menuitem"
            @click="$emit('select', 'rename')"
          >
            <span aria-hidden="true">✎</span>
            <span>{{ t("chat.historyMenu.rename") }}</span>
          </button>
          <button
            class="chat-history-context-menu__item"
            type="button"
            role="menuitem"
            @click="$emit('select', 'share')"
          >
            <span aria-hidden="true">↗</span>
            <span>{{ t("chat.historyMenu.share") }}</span>
          </button>
          <button
            class="chat-history-context-menu__item chat-history-context-menu__item--danger"
            type="button"
            role="menuitem"
            @click="$emit('select', 'delete')"
          >
            <span aria-hidden="true">🗑</span>
            <span>{{ t("chat.historyMenu.delete") }}</span>
          </button>
        </div>
      </transition>
    </div>
  </teleport>
</template>

<script setup>
/**
 * @file components/navigation/history/ChatHistoryActionFloatMenu.vue
 * @description PC 채팅 이력 액션 FloatMenu 전용 컴포넌트입니다.
 */

import {computed, nextTick, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {autoUpdate, flip, offset, shift, useFloating} from "@floating-ui/vue";

const props = defineProps({
  open: {type: Boolean, default: false},
  target: {type: Object, default: null},
  referenceEl: {type: Object, default: null},
});

defineEmits(["select"]);

const {t} = useI18n();
const menuRef = ref(null);
const referenceRef = computed(() => props.referenceEl || null);
const positionReady = ref(false);

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

const hasMeasuredPosition = computed(
  () => Number.isFinite(x.value) && Number.isFinite(y.value)
);
const contextMenuStyle = computed(() => {
  const ready = props.open && positionReady.value && hasMeasuredPosition.value;
  return {
    ...floatingStyles.value,
    position: "fixed",
    visibility: ready ? "visible" : "hidden",
    pointerEvents: ready ? "auto" : "none",
  };
});
const isPinned = computed(() => Boolean(props.target?.isPinned));
const pinActionKey = computed(() => (isPinned.value ? "unpin" : "pin"));
const pinActionIcon = computed(() => (isPinned.value ? "☆" : "★"));
const pinActionLabel = computed(() =>
  isPinned.value ? t("chat.historyMenu.unpin") : t("chat.historyMenu.pin")
);

watch(
  () => [props.open, props.referenceEl],
  async () => {
    positionReady.value = false;
    if (!props.open) return;

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
