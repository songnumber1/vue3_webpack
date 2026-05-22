export const PROMPT_TEMPLATES_RAW = {
  "prompts": [
    {
      "prompts_id": "model-ds-thinking-0-direct-input",
      "model_id": "model-ds-thinking",
      "delYN": false,
      "default": true,
      "promptTemplateOrder": 0,
      "name_ko": "직접입력",
      "name_en": "Direct Input",
      "desc_ko": "자유롭게 입력합니다.",
      "desc_en": "Free-form input.",
      "promptTemplateName": "직접입력",
      "promptTemplate": {}
    },
    {
      "prompts_id": "model-ds-thinking-1-mail",
      "model_id": "model-ds-thinking",
      "delYN": false,
      "default": false,
      "promptTemplateOrder": 1,
      "name_ko": "메일",
      "name_en": "Mail",
      "desc_ko": "메일 작성 템플릿",
      "desc_en": "Email writing template",
      "promptTemplateName": "메일",
      "promptTemplate": {
        "language": {
          "en": "Language",
          "ko": "언어",
          "type": "radio",
          "content": [
            {
              "tag": "영어",
              "en": "English",
              "ko": "영어로"
            },
            {
              "tag": "한국어",
              "en": "Korean",
              "ko": "한국어로"
            }
          ]
        },
        "style": {
          "en": "Style",
          "ko": "스타일",
          "type": "radio",
          "content": [
            {
              "tag": "기본",
              "en": "Default",
              "ko": "기본"
            },
            {
              "tag": "정중하게",
              "en": "Polite",
              "ko": "정중하게"
            },
            {
              "tag": "친근하게",
              "en": "Friendly",
              "ko": "친근하게"
            }
          ]
        },
        "length": {
          "en": "Length",
          "ko": "길이",
          "type": "radio",
          "content": [
            {
              "tag": "기본",
              "en": "Default",
              "ko": "기본"
            },
            {
              "tag": "짧게",
              "en": "Short",
              "ko": "짧게"
            },
            {
              "tag": "길게",
              "en": "Long",
              "ko": "길게"
            }
          ]
        }
      }
    },
    {
      "prompts_id": "model-ds-thinking-2-translate",
      "model_id": "model-ds-thinking",
      "delYN": false,
      "default": false,
      "promptTemplateOrder": 2,
      "name_ko": "번역",
      "name_en": "Translate",
      "desc_ko": "번역 템플릿",
      "desc_en": "Translation template",
      "promptTemplateName": "번역",
      "promptTemplate": {
        "language": {
          "en": "Language",
          "ko": "언어",
          "type": "radio",
          "content": [
            {
              "tag": "영어",
              "en": "English",
              "ko": "영어로"
            },
            {
              "tag": "한국어",
              "en": "Korean",
              "ko": "한국어로"
            }
          ]
        },
        "style": {
          "en": "Style",
          "ko": "스타일",
          "type": "radio",
          "content": [
            {
              "tag": "기본",
              "en": "Default",
              "ko": "기본"
            },
            {
              "tag": "정중하게",
              "en": "Polite",
              "ko": "정중하게"
            },
            {
              "tag": "친근하게",
              "en": "Friendly",
              "ko": "친근하게"
            }
          ]
        }
      }
    },
    {
      "prompts_id": "model-ds-thinking-3-summary",
      "model_id": "model-ds-thinking",
      "delYN": false,
      "default": false,
      "promptTemplateOrder": 3,
      "name_ko": "요약",
      "name_en": "Summary",
      "desc_ko": "요약 템플릿",
      "desc_en": "Summary template",
      "promptTemplateName": "요약",
      "promptTemplate": {
        "language": {
          "en": "Language",
          "ko": "언어",
          "type": "radio",
          "content": [
            {
              "tag": "영어",
              "en": "English",
              "ko": "영어로"
            },
            {
              "tag": "한국어",
              "en": "Korean",
              "ko": "한국어로"
            }
          ]
        },
        "style": {
          "en": "Style",
          "ko": "스타일",
          "type": "radio",
          "content": [
            {
              "tag": "문단식",
              "en": "Paragraph",
              "ko": "문단식"
            },
            {
              "tag": "개조식",
              "en": "Bullet",
              "ko": "개조식"
            }
          ]
        },
        "length": {
          "en": "Length",
          "ko": "길이",
          "type": "radio",
          "content": [
            {
              "tag": "기본",
              "en": "Default",
              "ko": "기본"
            },
            {
              "tag": "짧게",
              "en": "Short",
              "ko": "짧게"
            },
            {
              "tag": "길게",
              "en": "Long",
              "ko": "길게"
            }
          ]
        }
      }
    },
    {
      "prompts_id": "model-ds-thinking-4-code",
      "model_id": "model-ds-thinking",
      "delYN": false,
      "default": false,
      "promptTemplateOrder": 4,
      "name_ko": "코드",
      "name_en": "Code",
      "desc_ko": "코드 생성/리뷰 템플릿",
      "desc_en": "Code generation/review template",
      "promptTemplateName": "코드",
      "promptTemplate": {}
    },
    {
      "prompts_id": "model-ds-rag-0-direct-input",
      "model_id": "model-ds-rag",
      "delYN": false,
      "default": true,
      "promptTemplateOrder": 0,
      "name_ko": "직접입력",
      "name_en": "Direct Input",
      "desc_ko": "자유롭게 입력합니다.",
      "desc_en": "Free-form input.",
      "promptTemplateName": "직접입력",
      "promptTemplate": {}
    },
    {
      "prompts_id": "model-ds-rag-1-mail",
      "model_id": "model-ds-rag",
      "delYN": false,
      "default": false,
      "promptTemplateOrder": 1,
      "name_ko": "메일",
      "name_en": "Mail",
      "desc_ko": "메일 작성 템플릿",
      "desc_en": "Email writing template",
      "promptTemplateName": "메일",
      "promptTemplate": {
        "language": {
          "en": "Language",
          "ko": "언어",
          "type": "radio",
          "content": [
            {
              "tag": "영어",
              "en": "English",
              "ko": "영어로"
            },
            {
              "tag": "한국어",
              "en": "Korean",
              "ko": "한국어로"
            }
          ]
        },
        "style": {
          "en": "Style",
          "ko": "스타일",
          "type": "radio",
          "content": [
            {
              "tag": "기본",
              "en": "Default",
              "ko": "기본"
            },
            {
              "tag": "정중하게",
              "en": "Polite",
              "ko": "정중하게"
            },
            {
              "tag": "친근하게",
              "en": "Friendly",
              "ko": "친근하게"
            }
          ]
        },
        "length": {
          "en": "Length",
          "ko": "길이",
          "type": "radio",
          "content": [
            {
              "tag": "기본",
              "en": "Default",
              "ko": "기본"
            },
            {
              "tag": "짧게",
              "en": "Short",
              "ko": "짧게"
            },
            {
              "tag": "길게",
              "en": "Long",
              "ko": "길게"
            }
          ]
        }
      }
    },
    {
      "prompts_id": "model-ds-rag-2-translate",
      "model_id": "model-ds-rag",
      "delYN": false,
      "default": false,
      "promptTemplateOrder": 2,
      "name_ko": "번역",
      "name_en": "Translate",
      "desc_ko": "번역 템플릿",
      "desc_en": "Translation template",
      "promptTemplateName": "번역",
      "promptTemplate": {
        "language": {
          "en": "Language",
          "ko": "언어",
          "type": "radio",
          "content": [
            {
              "tag": "영어",
              "en": "English",
              "ko": "영어로"
            },
            {
              "tag": "한국어",
              "en": "Korean",
              "ko": "한국어로"
            }
          ]
        },
        "style": {
          "en": "Style",
          "ko": "스타일",
          "type": "radio",
          "content": [
            {
              "tag": "기본",
              "en": "Default",
              "ko": "기본"
            },
            {
              "tag": "정중하게",
              "en": "Polite",
              "ko": "정중하게"
            },
            {
              "tag": "친근하게",
              "en": "Friendly",
              "ko": "친근하게"
            }
          ]
        }
      }
    },
    {
      "prompts_id": "model-ds-rag-3-summary",
      "model_id": "model-ds-rag",
      "delYN": false,
      "default": false,
      "promptTemplateOrder": 3,
      "name_ko": "요약",
      "name_en": "Summary",
      "desc_ko": "요약 템플릿",
      "desc_en": "Summary template",
      "promptTemplateName": "요약",
      "promptTemplate": {
        "language": {
          "en": "Language",
          "ko": "언어",
          "type": "radio",
          "content": [
            {
              "tag": "영어",
              "en": "English",
              "ko": "영어로"
            },
            {
              "tag": "한국어",
              "en": "Korean",
              "ko": "한국어로"
            }
          ]
        },
        "style": {
          "en": "Style",
          "ko": "스타일",
          "type": "radio",
          "content": [
            {
              "tag": "문단식",
              "en": "Paragraph",
              "ko": "문단식"
            },
            {
              "tag": "개조식",
              "en": "Bullet",
              "ko": "개조식"
            }
          ]
        },
        "length": {
          "en": "Length",
          "ko": "길이",
          "type": "radio",
          "content": [
            {
              "tag": "기본",
              "en": "Default",
              "ko": "기본"
            },
            {
              "tag": "짧게",
              "en": "Short",
              "ko": "짧게"
            },
            {
              "tag": "길게",
              "en": "Long",
              "ko": "길게"
            }
          ]
        }
      }
    },
    {
      "prompts_id": "model-ds-rag-4-code",
      "model_id": "model-ds-rag",
      "delYN": false,
      "default": false,
      "promptTemplateOrder": 4,
      "name_ko": "코드",
      "name_en": "Code",
      "desc_ko": "코드 생성/리뷰 템플릿",
      "desc_en": "Code generation/review template",
      "promptTemplateName": "코드",
      "promptTemplate": {}
    }
  ]
};
