import rawData from "@/data/data.json";

const GROUPS = Array.isArray(rawData?.assistants) ? rawData.assistants : [];

function getDefaultGroupId() {
  return GROUPS?.[0]?.id || "ds";
}

function getDefaultModelId(groupId) {
  const g = GROUPS.find((x) => x.id === groupId) || GROUPS[0];
  return g?.models?.[0]?.id || "";
}

export default function state() {
  const groupId = getDefaultGroupId();
  return {
    groups: GROUPS,
    groupId,
    modelId: getDefaultModelId(groupId),
    language: "ko", // ko | en
    // assistant별 마지막 모델 기억
    lastUsedModelByGroup: {},
  };
}

export { getDefaultModelId };
