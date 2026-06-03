<template>
  <ResourceDetailContent
    content-class="studio-detail-content"
    head-class="studio-dialog__head"
    image-class="studio-dialog__image"
    description-class="studio-dialog__desc"
    prompt-grid-class="studio-prompt-grid"
    box-class="studio-dialog__box"
    :title="studio.name"
    :meta="detailMeta"
    :description="studio.description"
    :image-text="studio.initial"
    :prompts="studio.prompts"
    :knowledge="studio.knowledge"
    :scope="studio.scope"
    :labels="detailLabels"
  />
</template>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import ResourceDetailContent from "@/components/common/catalog/ResourceDetailContent.vue";

const {t} = useI18n();

const props = defineProps({studio: {type: Object, required: true}});

const detailMeta = computed(
  () =>
    `${t("studio.likes")} ${props.studio.likes} · ${t("studio.questions")} ${props.studio.views} · ${props.studio.owner} · ${props.studio.model}`
);

const detailLabels = computed(() => ({
  prompts: t("studio.detail.prompts"),
  knowledge: t("studio.detail.knowledge"),
  scope: t("studio.detail.scope"),
}));
</script>
