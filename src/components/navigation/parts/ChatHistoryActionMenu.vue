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
    <transition name="modal-fade">
      <div
        v-if="desktopOpen"
        ref="menuRef"
        class="chat-history-context-menu"
        :style="desktopStyle"
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
  </teleport>
</template>

<script setup>
import {computed, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import BaseBottomSheet from '@/components/common/bottom-sheet/BaseBottomSheet.vue';

const props = defineProps({
  open: {type: Boolean, default: false},
  isMobile: {type: Boolean, default: false},
  target: {type: Object, default: null},
  position: {type: Object, default: () => ({top: 0, left: 0})},
});

defineEmits(['close', 'select']);
const {t} = useI18n();
const menuRef = ref(null);

const mobileOpen = computed(() => props.open && props.isMobile);
const desktopOpen = computed(() => props.open && !props.isMobile);
const targetTitle = computed(() => props.target?.title || t('chat.historyMenu.title'));
const desktopStyle = computed(() => ({
  top: `${props.position.top || 0}px`,
  left: `${props.position.left || 0}px`,
}));
const actions = computed(() => {
  const pinAction = props.target?.isPinned
    ? {key: 'unpin', label: t('chat.historyMenu.unpin'), icon: '☆'}
    : {key: 'pin', label: t('chat.historyMenu.pin'), icon: '★'};
  return [
    pinAction,
    {key: 'rename', label: t('chat.historyMenu.rename'), icon: '✎'},
    {key: 'share', label: t('chat.historyMenu.share'), icon: '↗'},
    {key: 'delete', label: t('chat.historyMenu.delete'), icon: '🗑', danger: true},
  ];
});

defineExpose({menuRef});
</script>
