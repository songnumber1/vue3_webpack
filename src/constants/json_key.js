// ✅ 모든 data.json 키를 여기서만 관리
// (API의 키가 변경되어도 코드 수정 최소화)

export const JSON_KEY = Object.freeze({
  // top-level
  ASSISTANTS: "assistants",
  MODELS: "models",
  PROMPTS: "prompts",
  EXAMPLES: "examples",
  INPUT_HEADER: "inputHeader",

  // common fields
  DEL_YN: "delYN",
  ID: "id",
  NAME_KO: "name_ko",
  NAME_EN: "name_en",
  DESC_KO: "desc_ko",
  DESC_EN: "desc_en",

  // relations / foreign keys
  ASSISTANT_ID: "assistant_id",
  MODEL_ID: "model_id",
  PROMPTS_ID: "prompts_id",
  PROMPT_ID: "prompts_id", // alias
  EXAMPLE_ID: "example_id",

  // assistant specific
  MODEL_IDS: "modelIds", // assistants.modelIds (FK list)
  ICON: "icon",
  DEFAULT_MODEL_ID: "default_model_id",

  // model specific
  GROUP_ID: "group_id", // = assistant_id ("modelGroup은 assistant")
  DEFAULT_YN: "default",
  INPUT_MODE: "inputMode",

  // prompt specific
  TEMPLATE: "promptTemplate",
  TEMPLATE_NAME: "promptTemplateName",
  TEMPLATE_ORDER: "promptTemplateOrder",

  // example specific
  TITLE: "title",
  CONTENT: "content",
});