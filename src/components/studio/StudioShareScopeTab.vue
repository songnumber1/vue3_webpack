<template>
  <div class="studio-form-stack studio-share-tab tw-grid tw-min-w-0 tw-gap-3">
    <fieldset
      class="studio-scope-fieldset tw-grid tw-min-w-0 tw-gap-3 md:tw-grid-cols-2"
    >
      <legend>{{ t("studio.share.target") }}</legend>
      <label
        class="studio-radio-row tw-inline-flex tw-min-w-0 tw-cursor-pointer tw-items-center tw-gap-2"
        :class="{active: scope === 'public'}"
      >
        <input
          :checked="scope === 'public'"
          type="radio"
          value="public"
          @change="createForm.updateScope?.('public')"
        />
        <span>{{ t("studio.share.public") }}</span>
      </label>
      <label
        class="studio-radio-row tw-inline-flex tw-min-w-0 tw-cursor-pointer tw-items-center tw-gap-2"
        :class="{active: scope === 'private'}"
      >
        <input
          :checked="scope === 'private'"
          type="radio"
          value="private"
          @change="createForm.updateScope?.('private')"
        />
        <span>{{ t("studio.share.private") }}</span>
      </label>
    </fieldset>

    <section
      class="studio-authority-section tw-grid tw-min-w-0 tw-gap-2.5"
      :aria-label="t('studio.share.listLabel')"
    >
      <div
        class="studio-authority-section__head tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-3"
      >
        <strong>{{ t("studio.share.listLabel") }}</strong>
        <div
          class="studio-authority-actions tw-flex tw-shrink-0 tw-items-center tw-gap-2"
        >
          <button
            class="studio-button studio-button--primary-ghost tw-inline-flex tw-min-h-8 tw-items-center tw-justify-center tw-rounded-studio tw-border tw-border-solid tw-border-studio-primary tw-bg-studio-surface tw-px-3 tw-font-bold tw-text-studio-primary"
            type="button"
            @click="createForm.openAuthorityPicker?.()"
          >
            + {{ t("studio.share.add") }}
          </button>
          <button
            class="studio-button studio-button--danger-ghost tw-inline-flex tw-min-h-8 tw-items-center tw-justify-center tw-rounded-studio tw-border tw-border-solid tw-bg-studio-surface tw-px-3 tw-font-bold"
            type="button"
            @click="createForm.deleteCheckedAuthorities?.()"
          >
            {{ t("studio.share.delete") }}
          </button>
        </div>
      </div>
      <div
        class="studio-authority-grid tw-grid tw-min-w-0 tw-overflow-hidden tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface"
        role="table"
        :aria-label="t('studio.share.listLabel')"
      >
        <div class="studio-authority-grid__head" role="row">
          <div role="columnheader">
            <input
              type="checkbox"
              :checked="allAuthoritiesChecked"
              @change="createForm.toggleAllAuthorities?.($event.target.checked)"
            />
          </div>
          <div role="columnheader">{{ t("studio.share.authorityName") }}</div>
          <div role="columnheader">{{ t("studio.share.description") }}</div>
        </div>
        <div
          v-for="auth in authorities"
          :key="auth.deptId"
          class="studio-authority-grid__row"
          role="row"
        >
          <div role="cell">
            <input
              :checked="auth.checked"
              type="checkbox"
              @change="
                createForm.toggleAuthority?.(
                  auth.deptId,
                  $event.target.checked
                )
              "
            />
          </div>
          <div role="cell">{{ auth.deptNameKo }}</div>
          <div role="cell">{{ auth.description }}</div>
        </div>
        <div
          v-if="!authorities.length"
          class="studio-authority-grid__empty tw-p-2.5 tw-text-studio-muted"
        >
          {{ t("studio.share.empty") }}
        </div>
      </div>
      <nav
        class="studio-authority-pagination tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-gap-1.5 tw-pt-2.5"
        :aria-label="t('studio.share.listLabel')"
      >
        <button
          class="tw-h-8 tw-min-w-8 tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface disabled:tw-opacity-45"
          type="button"
          disabled
        >
          ‹
        </button>
        <button
          class="active tw-h-8 tw-min-w-8 tw-rounded-studio tw-border tw-border-solid tw-border-studio-primary tw-bg-studio-surface tw-font-extrabold tw-text-studio-primary"
          type="button"
        >
          1
        </button>
        <button
          class="tw-h-8 tw-min-w-8 tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface disabled:tw-opacity-45"
          type="button"
          disabled
        >
          ›
        </button>
      </nav>
    </section>
  </div>
</template>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useStudioCreateForm} from "@/composables/studio/context/studioCreateFormContext";
const {t} = useI18n();
const createForm = useStudioCreateForm();
const draft = createForm.draft;
const scope = computed(() => draft.scope);
const authorities = createForm.selectedAuthorities;
const allAuthoritiesChecked = createForm.allAuthoritiesChecked;
</script>
