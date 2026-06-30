import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";
import {GENERATION_ERROR_TEST_MODEL_ID} from "@/constants/generationErrorTest";

const DONE_MESSAGE = "[DONE]";

function normalizeRawMessage(raw) {
  return String(raw || "");
}

function createUnchangedState(accumulated) {
  return {accumulated, changed: false, done: false};
}

function createDoneState(accumulated) {
  return {accumulated, changed: false, done: true};
}

function appendStreamText(raw, accumulated) {
  const text = normalizeRawMessage(raw);
  const normalized = text.trim();

  if (!normalized) return createUnchangedState(accumulated);
  if (normalized === DONE_MESSAGE) return createDoneState(accumulated);

  return {
    accumulated: accumulated + text,
    changed: true,
    done: false,
  };
}

function parseJsonSafely(raw) {
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function readFirstString(...values) {
  const found = values.find(
    (value) => typeof value === "string" && value.length > 0
  );
  return found || "";
}

function readThinkContent(raw) {
  const parsed = parseJsonSafely(raw);
  if (!parsed || typeof parsed !== "object") return "";

  const delta = parsed.delta || parsed.data || parsed.message || {};
  return readFirstString(
    parsed.content,
    parsed.answer,
    parsed.text,
    parsed.reasoning,
    parsed.reasoningContent,
    delta.content,
    delta.answer,
    delta.text,
    delta.reasoning,
    delta.reasoningContent
  );
}

export function parseNormalGenerationMessage(raw, accumulated) {
  return appendStreamText(raw, accumulated);
}

export function parseThinkGenerationMessage(raw, accumulated) {
  const text = normalizeRawMessage(raw);
  const normalized = text.trim();

  if (!normalized) return createUnchangedState(accumulated);
  if (normalized === DONE_MESSAGE) return createDoneState(accumulated);

  const content = readThinkContent(text);
  if (content) {
    return {
      accumulated: accumulated + content,
      changed: true,
      done: false,
    };
  }

  return appendStreamText(text, accumulated);
}

export function resolveGenerationStreamParser(modelId) {
  if (String(modelId || "") === GENERATION_ERROR_TEST_MODEL_ID) {
    return parseThinkGenerationMessage;
  }

  return parseNormalGenerationMessage;
}

export function resolveGenerationStreamParserFromPayload(payload = {}) {
  return resolveGenerationStreamParser(
    payload?.[G.MODEL_ID] || payload?.[G.MODEL_ID_LEGACY]
  );
}
