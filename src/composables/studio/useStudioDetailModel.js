import {ASSISTANT_TYPES} from "@/constants/domain";

const PORTAL_ASSISTANT_IDS = new Set(["assistant-studio", "connector-store"]);

function normalizeString(value) {
  return String(value ?? "").trim();
}

function firstNonEmpty(...values) {
  return values.find((value) => normalizeString(value)) || "";
}

export function isStudioAssistant(assistant = null) {
  if (!assistant || PORTAL_ASSISTANT_IDS.has(String(assistant.id || ""))) {
    return false;
  }

  return Boolean(
    assistant.type === ASSISTANT_TYPES.STUDIO ||
    assistant.type === "studio" ||
    assistant.isStudio ||
    assistant.studio === true
  );
}

export function isManageableStudio(source = null) {
  if (!source) return false;
  return Boolean(
    source.isMine ||
    source.mine ||
    source.editable ||
    source.manageable ||
    source.studio === true ||
    source.isStudio === true
  );
}

export function normalizeStudioDetail(source = null, options = {}) {
  if (!source) return null;

  const raw = source.raw || {};
  const id = firstNonEmpty(source.id, source.sourceId, raw.id, raw.assistId);
  if (!id) return null;

  const name = firstNonEmpty(source.name, source.label, raw.name, raw.assistNm);
  const initial = firstNonEmpty(source.initial, raw.initial, name).slice(0, 1);
  const prompts = Array.isArray(source.prompts)
    ? source.prompts
    : Array.isArray(raw.prompts)
      ? raw.prompts
      : Array.isArray(source.examples)
        ? source.examples
        : [];

  const studioFlag = Boolean(
    source.studio === true ||
    source.isStudio === true ||
    source.type === "studio" ||
    source.type === ASSISTANT_TYPES.STUDIO
  );

  return {
    ...source,
    id,
    name: name || "Studio Assistant",
    initial: (initial || "S").slice(0, 1).toUpperCase(),
    description: firstNonEmpty(
      source.description,
      raw.description,
      raw.assistDesc
    ),
    categoryCode:
      source.categoryCode || raw.categoryCode || raw.categoryId || "",
    category: source.category || raw.category || "",
    model: firstNonEmpty(
      source.model,
      raw.model,
      raw.modelNm,
      options.modelLabel
    ),
    likes: Number(source.likes ?? raw.likes ?? raw.likeCnt ?? 0),
    views: Number(source.views ?? raw.views ?? raw.questionCnt ?? 0),
    owner: firstNonEmpty(source.owner, raw.owner, raw.ownerNm, "user-1234"),
    isMine: isManageableStudio(source) || studioFlag,
    isStudio: true,
    studio: true,
    knowledge: firstNonEmpty(source.knowledge, raw.knowledge),
    scope: firstNonEmpty(source.scope, raw.scope, "공개"),
    prompts,
    raw,
  };
}
