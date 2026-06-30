<template>
  <div v-if="open && studio" class="studio-detail-viewer" role="presentation">
    <div class="studio-detail-viewer__backdrop" @click.self="close"></div>

    <article
      class="studio-detail-viewer__panel"
      role="dialog"
      aria-modal="true"
      :aria-label="t('studio.detail.title')"
    >
      <header class="studio-detail-viewer__header">
        <button
          class="studio-detail-viewer__icon-button studio-detail-viewer__back"
          type="button"
          :aria-label="t('common.back')"
          @click="close"
        >
          ‹
        </button>

        <strong class="studio-detail-viewer__title">
          {{ studio.name }}
        </strong>

        <button
          v-if="canManageStudio"
          class="studio-detail-viewer__icon-button studio-detail-viewer__settings"
          type="button"
          :disabled="actionsDisabled"
          :aria-label="t('studio.detail.settings')"
          :title="t('studio.detail.settings')"
          @click.stop="toggleActions"
        >
          <span
            class="studio-icon studio-icon--settings"
            aria-hidden="true"
          ></span>
        </button>

        <button
          class="studio-detail-viewer__icon-button studio-detail-viewer__close"
          type="button"
          :aria-label="t('common.close')"
          @click="close"
        >
          ×
        </button>
      </header>

      <div class="studio-detail-viewer__body">
        <div v-if="loading" class="studio-detail-viewer__state">
          {{ t("common.loading") }}
        </div>
        <div
          v-else-if="error"
          class="studio-detail-viewer__state studio-detail-viewer__state--error"
        >
          {{ error }}
        </div>
        <StudioInfoPanel v-else :studio="studio" />
      </div>

      <footer class="studio-detail-viewer__footer">
        <button
          class="studio-detail-viewer__footer-button"
          type="button"
          @click="close"
        >
          {{ closeLabel }}
        </button>
      </footer>
    </article>

    <StudioDetailActionBottomSheet
      :open="actionsOpen && canManageStudio"
      :disabled="actionsDisabled"
    />

    <div
      v-if="deleteConfirmOpen"
      class="studio-detail-viewer__confirm-backdrop"
    >
      <article
        class="studio-detail-viewer__confirm"
        role="dialog"
        aria-modal="true"
      >
        <header class="studio-detail-viewer__confirm-head">
          <strong>{{ t("studio.detail.deleteConfirmTitle") }}</strong>
          <button
            type="button"
            :aria-label="t('common.close')"
            @click="deleteConfirmOpen = false"
          >
            ×
          </button>
        </header>
        <p>{{ t("studio.detail.deleteConfirmMessage") }}</p>
        <footer class="studio-detail-viewer__confirm-footer">
          <button
            class="studio-detail-viewer__confirm-button"
            type="button"
            @click="deleteConfirmOpen = false"
          >
            {{ closeLabel }}
          </button>
          <button
            class="studio-detail-viewer__confirm-button studio-detail-viewer__confirm-button--danger"
            type="button"
            :disabled="actionsDisabled"
            @click="confirmDelete"
          >
            {{ t("studio.detail.deleteConfirmAction") }}
          </button>
        </footer>
      </article>
    </div>
  </div>
</template>

<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import StudioInfoPanel from "@/components/studio/StudioInfoPanel.vue";
import StudioDetailActionBottomSheet from "@/components/studio/detail/StudioDetailActionBottomSheet.vue";
import {
  provideStudioDetailActions,
  useStudioDetailActions,
} from "@/composables/studio/context/studioDetailActionContext";

const props = defineProps({
  open: {type: Boolean, default: false},
  studio: {type: Object, default: null},
  allowActions: {type: Boolean, default: true},
  actionsDisabled: {type: Boolean, default: false},
  loading: {type: Boolean, default: false},
  error: {type: String, default: ""},
});

const parentStudioDetailActions = useStudioDetailActions();
const {t} = useI18n();
const actionsOpen = ref(false);
const deleteConfirmOpen = ref(false);

const closeLabel = computed(() => t("common.close") || "닫기");

const canManageStudio = computed(() =>
  Boolean(props.allowActions && props.studio?.isMine)
);

provideStudioDetailActions({
  close: closeActionSheet,
  edit,
  delete: requestDelete,
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      actionsOpen.value = false;
      deleteConfirmOpen.value = false;
    }
  }
);


function close() {
  actionsOpen.value = false;
  deleteConfirmOpen.value = false;
  parentStudioDetailActions.close?.();
}

function closeActionSheet() {
  actionsOpen.value = false;
}

function toggleActions() {
  if (props.actionsDisabled) return;
  actionsOpen.value = !actionsOpen.value;
}

function edit() {
  if (props.actionsDisabled || !props.studio) return;
  actionsOpen.value = false;
  parentStudioDetailActions.edit?.(props.studio);
}

function requestDelete() {
  if (props.actionsDisabled || !props.studio) return;
  actionsOpen.value = false;
  deleteConfirmOpen.value = true;
}

function confirmDelete() {
  if (props.actionsDisabled || !props.studio) return;
  const studio = props.studio;
  deleteConfirmOpen.value = false;
  parentStudioDetailActions.delete?.(studio);
}
</script>

<style scoped lang="scss">
.studio-detail-viewer {
  position: fixed;
  inset: 0;
  z-index: 100000;
  box-sizing: border-box;
  color: var(--studio-text, #111827);
  pointer-events: auto;
}

.studio-detail-viewer__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
}

.studio-detail-viewer__panel {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  display: flex;
  width: 100dvw;
  height: 100dvh;
  max-width: none;
  max-height: none;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  border-radius: 0;
  background: var(--studio-surface, #fff);
  color: var(--studio-text, #111827);
  overflow: hidden;
}

.studio-detail-viewer__header {
  position: relative;
  z-index: 2;
  display: flex;
  box-sizing: border-box;
  min-height: 48px;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--studio-border, #e5e7eb);
  background: var(--studio-surface, #fff);
}

.studio-detail-viewer__title {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 17px;
}


.studio-detail-viewer__icon-button {
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--studio-border, #e5e7eb);
  border-radius: var(--radius-studio, 6px);
  background: var(--studio-surface, #fff);
  color: var(--studio-text, #111827);
  font: inherit;
  cursor: pointer;
}

.studio-detail-viewer__back {
  border-color: transparent;
  font-size: 28px;
  line-height: 1;
}

.studio-detail-viewer__body {
  box-sizing: border-box;
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0 24px 20px;
}

.studio-detail-viewer__panel--mobile .studio-detail-viewer__body {
  padding: 24px 24px 20px;
}

.studio-detail-viewer__footer {
  position: relative;
  z-index: 2;
  display: flex;
  box-sizing: border-box;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-height: 64px;
  padding: 12px 24px;
  border-top: 1px solid var(--studio-border, #e5e7eb);
  background: var(--studio-surface, #fff);
}

.studio-detail-viewer__panel--mobile .studio-detail-viewer__footer {
  padding-bottom: max(12px, env(safe-area-inset-bottom, 0px));
}

.studio-detail-viewer__footer-button {
  display: inline-flex;
  min-width: 74px;
  min-height: 38px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--studio-primary, #10a37f);
  border-radius: var(--radius-studio, 6px);
  background: var(--studio-primary, #10a37f);
  color: #fff;
  padding: 0 18px;
  font: inherit;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.studio-detail-viewer__footer-button:hover,
.studio-detail-viewer__footer-button:focus-visible {
  background: var(--studio-primary-strong, #0e8f71);
  border-color: var(--studio-primary-strong, #0e8f71);
}

.studio-detail-viewer__confirm-button {
  display: inline-flex;
  min-width: 64px;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--studio-border, #e5e7eb);
  border-radius: var(--radius-studio, 6px);
  background: var(--studio-surface, #fff);
  color: var(--studio-text, #111827);
  padding: 0 14px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.studio-detail-viewer__confirm-button--danger {
  border-color: rgba(220, 38, 38, 0.35);
  color: #dc2626;
}

.studio-detail-viewer__state {
  padding: 48px 0;
  color: var(--studio-muted, #6b7280);
  text-align: center;
}

.studio-detail-viewer__state--error {
  color: #b91c1c;
}

.studio-detail-viewer__sheet-backdrop,
.studio-detail-viewer__confirm-backdrop {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(15, 23, 42, 0.34);
}

.studio-detail-viewer__sheet {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  padding: 12px 16px max(20px, env(safe-area-inset-bottom, 0px));
  border-radius: 18px 18px 0 0;
  background: var(--studio-surface, #fff);
  box-shadow: 0 -18px 42px rgba(15, 23, 42, 0.18);
}

.studio-detail-viewer__sheet-head,
.studio-detail-viewer__confirm-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.studio-detail-viewer__sheet-head button,
.studio-detail-viewer__confirm-head button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 22px;
}

.studio-detail-viewer__sheet-option {
  display: flex;
  width: 100%;
  min-height: 48px;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 12px 4px;
  text-align: left;
}

.studio-detail-viewer__sheet-option:hover {
  background: var(--studio-controlHover, #f3f4f6);
}

.studio-detail-viewer__sheet-option--danger {
  color: #dc2626 !important;
}

.studio-detail-viewer__confirm {
  position: absolute;
  top: 50%;
  left: 50%;
  box-sizing: border-box;
  width: min(360px, calc(100vw - 32px));
  transform: translate(-50%, -50%);
  border-radius: 14px;
  background: var(--studio-surface, #fff);
  padding: 18px;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.24);
}

.studio-detail-viewer__confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}
</style>
