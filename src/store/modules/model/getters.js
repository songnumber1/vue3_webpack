import rawData from "@/data/data.json";
import { JSON_KEYS } from "@/constants/jsonKeys";

const ASSISTANTS = Array.isArray(rawData?.[JSON_KEYS.ASSISTANTS])
  ? rawData[JSON_KEYS.ASSISTANTS]
  : [];
const MODELS = Array.isArray(rawData?.[JSON_KEYS.MODELS])
  ? rawData[JSON_KEYS.MODELS]
  : [];

function activeModelsForGroup(groupId) {
  const group = ASSISTANTS.find((x) => x?.[JSON_KEYS.ID] === groupId) || ASSISTANTS[0];
  const modelIds = Array.isArray(group?.[JSON_KEYS.MODEL_IDS]) ? group[JSON_KEYS.MODEL_IDS] : [];
  const byId = new Set(modelIds);

  return MODELS.filter((m) => {
    if (!m) return false;
    const okAssistant = m[JSON_KEYS.ASSISTANT_ID] === groupId;
    const okId = byId.size ? byId.has(m[JSON_KEYS.ID]) : true;
    const okDel = m[JSON_KEYS.DEL_YN] === false;
    return okAssistant && okId && okDel;
  });
}

export default {
  groups: (s) => s.groups || [],

  groupLabel: (s) =>
    (ASSISTANTS.find((x) => x?.[JSON_KEYS.ID] === s.groupId) || {})[JSON_KEYS.LABEL] || s.groupId,

  // UI에서 쓰는 모델 옵션 배열: { id, label }
  modelsForGroup: (s) => {
    const list = activeModelsForGroup(s.groupId);
    const isKo = s.language === "ko";
    return list.map((m) => ({
      id: m[JSON_KEYS.ID],
      label: isKo ? m[JSON_KEYS.NAME_KO] : m[JSON_KEYS.NAME_EN],
    }));
  },

  currentModelLabel: (s, g) =>
    (g.modelsForGroup.find((m) => m.id === s.modelId) || {}).label || s.modelId,
};
