/**
 * @file promptAdapter.js
 * @description JavaScript module for promptAdapter.
 */

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
