<template>
  <ResourceDetailContent
    content-class="studio-detail-content"
    head-class="studio-dialog__head"
    image-class="studio-dialog__image"
    description-class="studio-dialog__desc"
    prompt-grid-class="studio-prompt-grid"
    box-class="studio-dialog__box"
    :title="mcp.name"
    :meta="detailMeta"
    :description="mcp.description"
    :image-text="mcp.initial"
    :prompts="mcp.prompts"
    :knowledge="mcp.knowledge"
    :scope="mcp.scope"
    :labels="detailLabels"
  />
</template>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import ResourceDetailContent from "@/components/common/catalog/ResourceDetailContent.vue";

const {t} = useI18n();
const props = defineProps({mcp: {type: Object, required: true}});

const detailMeta = computed(
  () =>
    `${t("mcp.likes")} ${props.mcp.likes} · ${t("mcp.subscribers")} ${props.mcp.views} · ${props.mcp.owner} · ${props.mcp.model}`
);

const detailLabels = computed(() => ({
  prompts: t("mcp.detail.examples"),
  knowledge: t("mcp.detail.capabilities"),
  scope: t("mcp.detail.scope"),
}));
</script>
