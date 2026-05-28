/**
 * @file api/mock/data/promptTemplates.raw.js
 * @description 개발/데모용 mock API 또는 mock 데이터입니다. 실제 API 비활성화 시 화면 동작을 보장합니다.
 */

export const PROMPT_TEMPLATES_RAW = {
  prompts: [
    {
      modelId: "model-ds-thinking",
      delYN: false,
      default: true,
      promptTemplateOrder: 0,
      promptTemplateName: "직접입력",
      promptTemplateNameEn: "Direct Input",
      promptTemplate: {},
    },
    {
      modelId: "model-ds-thinking",
      delYN: false,
      default: false,
      promptTemplateOrder: 1,
      promptTemplateName: "메일",
      promptTemplateNameEn: "Mail",
      promptTemplate: {
        language: {
          en: "Language",
          ko: "언어",
          type: "radio",
          content: [
            {
              tag: "영어",
              en: "English",
              ko: "영어로",
            },
            {
              tag: "한국어",
              en: "Korean",
              ko: "한국어로",
            },
          ],
        },
        style: {
          en: "Style",
          ko: "스타일",
          type: "radio",
          content: [
            {
              tag: "기본",
              en: "Default",
              ko: "기본",
            },
            {
              tag: "정중하게",
              en: "Polite",
              ko: "정중하게",
            },
            {
              tag: "친근하게",
              en: "Friendly",
              ko: "친근하게",
            },
          ],
        },
        length: {
          en: "Length",
          ko: "길이",
          type: "radio",
          content: [
            {
              tag: "기본",
              en: "Default",
              ko: "기본",
            },
            {
              tag: "짧게",
              en: "Short",
              ko: "짧게",
            },
            {
              tag: "길게",
              en: "Long",
              ko: "길게",
            },
          ],
        },
      },
    },
    {
      modelId: "model-ds-thinking",
      delYN: false,
      default: false,
      promptTemplateOrder: 2,
      promptTemplateName: "번역",
      promptTemplateNameEn: "Translate",
      promptTemplate: {
        language: {
          en: "Language",
          ko: "언어",
          type: "radio",
          content: [
            {
              tag: "영어",
              en: "English",
              ko: "영어로",
            },
            {
              tag: "한국어",
              en: "Korean",
              ko: "한국어로",
            },
          ],
        },
        style: {
          en: "Style",
          ko: "스타일",
          type: "radio",
          content: [
            {
              tag: "기본",
              en: "Default",
              ko: "기본",
            },
            {
              tag: "정중하게",
              en: "Polite",
              ko: "정중하게",
            },
            {
              tag: "친근하게",
              en: "Friendly",
              ko: "친근하게",
            },
          ],
        },
      },
    },
    {
      modelId: "model-ds-thinking",
      delYN: false,
      default: false,
      promptTemplateOrder: 3,
      promptTemplateName: "요약",
      promptTemplateNameEn: "Summary",
      promptTemplate: {
        language: {
          en: "Language",
          ko: "언어",
          type: "radio",
          content: [
            {
              tag: "영어",
              en: "English",
              ko: "영어로",
            },
            {
              tag: "한국어",
              en: "Korean",
              ko: "한국어로",
            },
          ],
        },
        style: {
          en: "Style",
          ko: "스타일",
          type: "radio",
          content: [
            {
              tag: "문단식",
              en: "Paragraph",
              ko: "문단식",
            },
            {
              tag: "개조식",
              en: "Bullet",
              ko: "개조식",
            },
          ],
        },
        length: {
          en: "Length",
          ko: "길이",
          type: "radio",
          content: [
            {
              tag: "기본",
              en: "Default",
              ko: "기본",
            },
            {
              tag: "짧게",
              en: "Short",
              ko: "짧게",
            },
            {
              tag: "길게",
              en: "Long",
              ko: "길게",
            },
          ],
        },
      },
    },
    {
      modelId: "model-ds-thinking",
      delYN: false,
      default: false,
      promptTemplateOrder: 4,
      promptTemplateName: "코드",
      promptTemplateNameEn: "Code",
      promptTemplate: {},
    },
    {
      modelId: "model-ds-rag",
      delYN: false,
      default: true,
      promptTemplateOrder: 0,
      promptTemplateName: "직접입력",
      promptTemplateNameEn: "Direct Input",
      promptTemplate: {},
    },
    {
      modelId: "model-ds-rag",
      delYN: false,
      default: false,
      promptTemplateOrder: 1,
      promptTemplateName: "메일",
      promptTemplateNameEn: "Mail",
      promptTemplate: {
        language: {
          en: "Language",
          ko: "언어",
          type: "radio",
          content: [
            {
              tag: "영어",
              en: "English",
              ko: "영어로",
            },
            {
              tag: "한국어",
              en: "Korean",
              ko: "한국어로",
            },
          ],
        },
        style: {
          en: "Style",
          ko: "스타일",
          type: "radio",
          content: [
            {
              tag: "기본",
              en: "Default",
              ko: "기본",
            },
            {
              tag: "정중하게",
              en: "Polite",
              ko: "정중하게",
            },
            {
              tag: "친근하게",
              en: "Friendly",
              ko: "친근하게",
            },
          ],
        },
        length: {
          en: "Length",
          ko: "길이",
          type: "radio",
          content: [
            {
              tag: "기본",
              en: "Default",
              ko: "기본",
            },
            {
              tag: "짧게",
              en: "Short",
              ko: "짧게",
            },
            {
              tag: "길게",
              en: "Long",
              ko: "길게",
            },
          ],
        },
      },
    },
    {
      modelId: "model-ds-rag",
      delYN: false,
      default: false,
      promptTemplateOrder: 2,
      promptTemplateName: "번역",
      promptTemplateNameEn: "Translate",
      promptTemplate: {
        language: {
          en: "Language",
          ko: "언어",
          type: "radio",
          content: [
            {
              tag: "영어",
              en: "English",
              ko: "영어로",
            },
            {
              tag: "한국어",
              en: "Korean",
              ko: "한국어로",
            },
          ],
        },
        style: {
          en: "Style",
          ko: "스타일",
          type: "radio",
          content: [
            {
              tag: "기본",
              en: "Default",
              ko: "기본",
            },
            {
              tag: "정중하게",
              en: "Polite",
              ko: "정중하게",
            },
            {
              tag: "친근하게",
              en: "Friendly",
              ko: "친근하게",
            },
          ],
        },
      },
    },
    {
      modelId: "model-ds-rag",
      delYN: false,
      default: false,
      promptTemplateOrder: 3,
      promptTemplateName: "요약",
      promptTemplateNameEn: "Summary",
      promptTemplate: {
        language: {
          en: "Language",
          ko: "언어",
          type: "radio",
          content: [
            {
              tag: "영어",
              en: "English",
              ko: "영어로",
            },
            {
              tag: "한국어",
              en: "Korean",
              ko: "한국어로",
            },
          ],
        },
        style: {
          en: "Style",
          ko: "스타일",
          type: "radio",
          content: [
            {
              tag: "문단식",
              en: "Paragraph",
              ko: "문단식",
            },
            {
              tag: "개조식",
              en: "Bullet",
              ko: "개조식",
            },
          ],
        },
        length: {
          en: "Length",
          ko: "길이",
          type: "radio",
          content: [
            {
              tag: "기본",
              en: "Default",
              ko: "기본",
            },
            {
              tag: "짧게",
              en: "Short",
              ko: "짧게",
            },
            {
              tag: "길게",
              en: "Long",
              ko: "길게",
            },
          ],
        },
      },
    },
    {
      modelId: "model-ds-rag",
      delYN: false,
      default: false,
      promptTemplateOrder: 4,
      promptTemplateName: "코드",
      promptTemplateNameEn: "Code",
      promptTemplate: {},
    },
  ],
};
