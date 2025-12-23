import rawData from "@/data/data.json";
import { JSON_KEYS } from "@/constants/jsonKeys";

const RAW = rawData?.[JSON_KEYS.PROMPT_TEMPLATES] ?? rawData ?? [];

function byOrder(a,b){ return (a.promptTemplateOrder??0)-(b.promptTemplateOrder??0); }
function safeArray(v){ return Array.isArray(v)?v:[]; }

function normalizeTemplate(t){
  return {
    delYN: !!t.delYN,
    default: !!t.default,
    promptTemplateOrder: Number.isFinite(t.promptTemplateOrder)?t.promptTemplateOrder:0,
    modelId: String(t.modelId??""),
    promptTemplateId: String(t.promptTemplateId??""),
    promptTemplateName: String(t.promptTemplateName??""),
    promptTemplate: t.promptTemplate || {},
  };
}

const TEMPLATES = safeArray(RAW).map(normalizeTemplate).sort(byOrder);

export default function state(){
  return {
    templates: TEMPLATES,
    selectedTemplateId: null,
    selectedTemplateName: null,
    selections: {}, // option selections {key: tag}
  };
}
