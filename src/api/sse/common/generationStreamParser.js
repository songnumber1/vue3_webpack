import {
  parseSseGenerationPayload,
  splitNestedSseData,
} from "@/adapters/sseResponseAdapter";

function parseGenerationStreamData(raw) {
  return parseSseGenerationPayload(raw);
}

function applyParsedGenerationData({data, accumulated, reasonAccumulated}) {
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
