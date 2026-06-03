import {readFirstString} from "@/adapters/adapterPrimitives";
import {
  SSE_RESPONSE_KEYS as S,
  SSE_RESPONSE_TOKENS,
} from "@/constants/api/sseResponseKeys";

export function createGenerationStreamError() {
  const error = new Error("generation stream returned Error");
  error.name = "GenerationStreamError";
  return error;
}

export function isSseDonePayload(raw) {
  return String(raw || "").trim() === SSE_RESPONSE_TOKENS.DONE;
}

export function isSseErrorPayload(raw) {
  return String(raw || "").trim() === "Error";
}

export function splitNestedSseData(raw) {
  const text = String(raw || "");
  const trimmed = text.trim();
  const dataPrefix = SSE_RESPONSE_TOKENS.DATA_PREFIX;

  if (!trimmed.startsWith(dataPrefix)) {
    return [text];
  }

  return trimmed
    .split(/(?=data:\s*)/g)
    .map((frame) => frame.replace(/^data:\s*/, "").trim())
    .filter(Boolean);
}

export function normalizeCompanyDelta(parsed) {
  const choices = parsed?.[S.CHOICES];
  const delta = Array.isArray(choices) ? choices[0]?.[S.DELTA] : null;
  if (!delta) return null;

  const content = readFirstString(delta[S.CONTENT]);

  // 회사 실시간 generation.do는 reasoning_content(snake_case)를 사용합니다.
  // 일부 테스트/레거시 응답이 reasoningContent(camelCase)를 보낼 수 있어
  // 수신부에서는 함께 흡수하되, 우선순위는 회사 규격인 reasoning_content입니다.
  const reason = readFirstString(
    delta[S.REASONING_CONTENT],
    delta[S.REASONING_CONTENT_CAMEL],
    delta[S.REASONING],
    delta[S.REASON_CONTENT]
  );

  return {
    done: false,
    type: reason ? "reason" : "answer",
    content,
    reason,
  };
}

export function normalizeLegacyPayload(parsed) {
  const reason = readFirstString(
    parsed?.[S.REASONING_CONTENT],
    parsed?.[S.REASONING_CONTENT_CAMEL],
    parsed?.[S.REASON_CONTENT],
    parsed?.[S.REASONING],
    parsed?.reason
  );
  const type = String(parsed?.type || (reason ? "reason" : "answer"));

  return {
    done: false,
    type,
    content: String(parsed?.[S.DATA] ?? parsed?.[S.CONTENT] ?? ""),
    reason,
  };
}

export function parseSseGenerationPayload(raw) {
  const normalizedRaw = String(raw || "").trim();

  if (isSseDonePayload(normalizedRaw)) return {done: true};
  if (isSseErrorPayload(normalizedRaw)) throw createGenerationStreamError();

  try {
    const parsed = JSON.parse(normalizedRaw);

    if (parsed === "Error") throw createGenerationStreamError();

    return normalizeCompanyDelta(parsed) || normalizeLegacyPayload(parsed);
  } catch (error) {
    if (error?.name === "GenerationStreamError") throw error;

    return {
      done: false,
      type: "answer",
      content: String(raw || ""),
      reason: "",
    };
  }
}
