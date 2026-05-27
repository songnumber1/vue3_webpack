const SSE_DONE_TOKEN = "[DONE]";

function createGenerationStreamError() {
  const error = new Error("generation stream returned Error");
  error.name = "GenerationStreamError";
  return error;
}

function normalizeCompanyDelta(parsed) {
  const delta = parsed?.choices?.[0]?.delta;
  if (!delta) return null;

  const content =
    typeof delta.content === "string" && delta.content !== ""
      ? delta.content
      : "";

  const reason =
    typeof delta.reasoning_content === "string" &&
    delta.reasoning_content !== ""
      ? delta.reasoning_content
      : typeof delta.reasoning === "string" && delta.reasoning !== ""
        ? delta.reasoning
        : "";

  return {
    done: false,
    type: reason ? "reason" : "answer",
    content,
    reason,
  };
}

function normalizeLegacyPayload(parsed) {
  const type = String(
    parsed?.type ||
      (parsed?.reason != null || parsed?.reasonContent != null
        ? "reason"
        : "answer")
  );

  return {
    done: false,
    type,
    content: String(parsed?.data ?? parsed?.content ?? ""),
    reason: String(parsed?.reason ?? parsed?.reasonContent ?? ""),
  };
}

function splitNestedSseData(raw) {
  const text = String(raw || "");
  const trimmed = text.trim();

  if (!trimmed.startsWith("data:")) {
    return [text];
  }

  return trimmed
    .split(/(?=data:\s*)/g)
    .map((frame) => frame.replace(/^data:\s*/, "").trim())
    .filter(Boolean);
}

function parseGenerationStreamData(raw) {
  const normalizedRaw = String(raw || "").trim();

  if (normalizedRaw === SSE_DONE_TOKEN) return {done: true};
  if (normalizedRaw === "Error") throw createGenerationStreamError();

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

function applyParsedGenerationData({
  data,
  accumulated,
  reasonAccumulated,
}) {
  if (data.done) {
    return {
      accumulated,
      reasonAccumulated,
      changed: false,
      reasonChanged: false,
      done: true,
    };
  }

  if (data.type === "reason") {
    const reasonContent = data.reason || data.content;
    if (!reasonContent) {
      return {
        accumulated,
        reasonAccumulated,
        changed: false,
        reasonChanged: false,
        done: false,
      };
    }

    return {
      accumulated,
      reasonAccumulated: reasonAccumulated + reasonContent,
      changed: false,
      reasonChanged: true,
      done: false,
    };
  }

  if (!data.content) {
    return {
      accumulated,
      reasonAccumulated,
      changed: false,
      reasonChanged: false,
      done: false,
    };
  }

  return {
    accumulated: accumulated + data.content,
    reasonAccumulated,
    changed: true,
    reasonChanged: false,
    done: false,
  };
}

export function applyGenerationStreamData({
  raw,
  accumulated,
  reasonAccumulated = "",
}) {
  const frames = splitNestedSseData(raw);
  let nextAccumulated = accumulated;
  let nextReasonAccumulated = reasonAccumulated;
  let changed = false;
  let reasonChanged = false;
  let done = false;

  frames.forEach((frame) => {
    if (done) return;

    const data = parseGenerationStreamData(frame);
    const nextState = applyParsedGenerationData({
      data,
      accumulated: nextAccumulated,
      reasonAccumulated: nextReasonAccumulated,
    });

    nextAccumulated = nextState.accumulated;
    nextReasonAccumulated = nextState.reasonAccumulated;
    changed = changed || nextState.changed;
    reasonChanged = reasonChanged || nextState.reasonChanged;
    done = nextState.done;
  });

  return {
    accumulated: nextAccumulated,
    reasonAccumulated: nextReasonAccumulated,
    changed,
    reasonChanged,
    done,
  };
}
