import {readFirstString} from "@/adapters/adapterPrimitives";
import {
  SSE_RESPONSE_KEYS as S,
  SSE_RESPONSE_TOKENS,
} from "@/constants/api/sseResponseKeys";

function readErrorMessage(errorValue) {
  if (!errorValue) return "";
  if (typeof errorValue === "string") return errorValue;
  if (typeof errorValue?.message === "string") return errorValue.message;
  if (typeof errorValue?.errorMessage === "string") return errorValue.errorMessage;
  if (typeof errorValue?.detail === "string") return errorValue.detail;
  return "";
}

function readErrorCode(errorValue, parsed) {
  if (typeof errorValue?.code === "string") return errorValue.code;
  if (typeof parsed?.code === "string") return parsed.code;
  if (typeof parsed?.errorCode === "string") return parsed.errorCode;
  return "SSE_STREAM_ERROR";
}

function readErrorStatus(errorValue, parsed) {
  const status = Number(
    errorValue?.status ||
      errorValue?.statusCode ||
      parsed?.status ||
      parsed?.statusCode ||
      0
  );
  return Number.isFinite(status) && status > 0 ? status : undefined;
}

export function createGenerationStreamError({
  message = "generation stream returned error",
  code = "SSE_STREAM_ERROR",
  status,
} = {}) {
  const error = new Error(message || "generation stream returned error");
  error.name = "GenerationStreamError";
  error.streamError = true;
  error.streamErrorCode = code || "SSE_STREAM_ERROR";
  if (status) error.status = status;
  return error;
}

function isErrorStatusPayload(parsed) {
  const status = String(parsed?.status || parsed?.type || "").toLowerCase();
  return status === "error" || status === "failed" || status === "fail";
}

function throwIfErrorPayload(parsed) {
  const errorValue = parsed?.error;
  const hasErrorPayload = Boolean(errorValue) || isErrorStatusPayload(parsed);
  if (!hasErrorPayload) return;

  const message =
    readErrorMessage(errorValue) ||
    readErrorMessage(parsed) ||
    "generation stream returned error";

  throw createGenerationStreamError({
    message,
    code: readErrorCode(errorValue, parsed),
    status: readErrorStatus(errorValue, parsed),
  });
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
  if (isSseErrorPayload(normalizedRaw)) {
    throw createGenerationStreamError({
      message: "generation stream returned Error",
      code: "SSE_STREAM_ERROR",
    });
  }

  try {
    const parsed = JSON.parse(normalizedRaw);

    if (parsed === "Error") {
      throw createGenerationStreamError({
        message: "generation stream returned Error",
        code: "SSE_STREAM_ERROR",
      });
    }

    throwIfErrorPayload(parsed);

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
