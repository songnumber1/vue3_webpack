import rawData from "@/data/data.json";
import { JSON_KEYS } from "@/constants/jsonKeys";

const ASSISTANTS = Array.isArray(rawData?.[JSON_KEYS.ASSISTANTS])
  ? rawData[JSON_KEYS.ASSISTANTS]
  : [];
const MODELS = Array.isArray(rawData?.[JSON_KEYS.MODELS])
  ? rawData[JSON_KEYS.MODELS]
  : [];

function getDefaultGroupId() {
  return ASSISTANTS?.[0]?.[JSON_KEYS.ID] || "ds";
}

function getActiveModelsForGroup(groupId) {
  const group = ASSISTANTS.find((x) => x?.[JSON_KEYS.ID] === groupId) || ASSISTANTS[0];
  const modelIds = Array.isArray(group?.[JSON_KEYS.MODEL_IDS]) ? group[JSON_KEYS.MODEL_IDS] : [];

  // assistant_id + modelIds 둘 다 만족 + del_yn=false 만
  const byId = new Set(modelIds);
  return MODELS.filter((m) => {
    if (!m) return false;
    const okAssistant = m[JSON_KEYS.ASSISTANT_ID] === groupId;
    const okId = byId.size ? byId.has(m[JSON_KEYS.ID]) : true;
    const okDel = m[JSON_KEYS.DEL_YN] === false;
    return okAssistant && okId && okDel;
  });
}

function getDefaultModelId(groupId) {
  const list = getActiveModelsForGroup(groupId);
  return list?.[0]?.[JSON_KEYS.ID] || "";
}

export default function state() {
  const groupId = getDefaultGroupId();
  return {
    groups: ASSISTANTS,
    groupId,
    modelId: getDefaultModelId(groupId),
    language: "ko", // ko | en
    lastUsedModelByGroup: {},
  };
}

export { getDefaultModelId, getActiveModelsForGroup };
