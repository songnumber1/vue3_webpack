/**
 * @file adapters/promptAdapter.js
 * @description 백엔드/mock 원본 응답을 화면에서 쓰기 쉬운 형태로 정규화하는 adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {PROMPT_TEMPLATE_MODEL_IDS} from "@/constants/promptComposer";
export function adaptExamplePrompt(raw = {}) {
  return {
    id: raw.question_id,
    assistId: raw.assist_id,
    titleKo: raw.example_view_kr || raw.example_content_kr || "",
    titleEn: raw.example_view_en || raw.example_content_en || "",
    contentKo: raw.example_content_kr || raw.example_view_kr || "",
    contentEn: raw.example_content_en || raw.example_view_en || "",
    categoryKo: raw.question_category_name_ko || "",
    categoryEn: raw.question_category_name_en || "",
    hasRag: Boolean(raw.rag_yn),
    raw,
  };
}
export function adaptExamplePromptList(response = {}) {
  return (response.list || [])
    .map(adaptExamplePrompt)
    .filter((item) => item.id);
}

/**
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
 */
function resolveTemplateKey(raw = {}) {
  const name = String(
    raw.promptTemplateName || raw.name_ko || raw.name_en || raw.nameKo || raw.nameEn || ""
  ).toLowerCase();

  if (["메일", "mail", "email"].includes(name)) return "mail";
  if (["번역", "translate", "translation"].includes(name)) return "translate";
  if (["요약", "summary", "summarize"].includes(name)) return "summary";
  if (["코드", "code"].includes(name)) return "code";
  if (["직접입력", "direct input"].includes(name)) return "direct";

  return name.replace(/\s+/g, "-");
}

export function adaptPromptTemplate(raw = {}) {
  const id = raw.prompts_id || raw.id || raw.promptTemplateId || "";
  const modelId = raw.model_id || raw.modelId || "";
  const template = raw.promptTemplate || {};

  return {
    id,
    modelId,
    key: resolveTemplateKey(raw),
    order: Number(raw.promptTemplateOrder ?? raw.order ?? 999),
    default: Boolean(raw.default),
    nameKo: raw.name_ko || raw.nameKo || raw.promptTemplateName || "",
    nameEn: raw.name_en || raw.nameEn || raw.promptTemplateName || "",
    descKo: raw.desc_ko || raw.descKo || "",
    descEn: raw.desc_en || raw.descEn || "",
    templateName: raw.promptTemplateName || raw.name_ko || raw.name_en || "",
    template,
    raw,
  };
}

export function adaptPromptTemplateList(response = {}) {
  const list = Array.isArray(response) ? response : response.list || response.prompts || [];
  return list
    .map(adaptPromptTemplate)
    .filter((item) => item.id)
    .filter((item) => !item.modelId || PROMPT_TEMPLATE_MODEL_IDS.includes(item.modelId))
    .sort((a, b) => a.order - b.order);
}
