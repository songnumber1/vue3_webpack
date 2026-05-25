import {readSseData} from "@/api/sse/sseParser";

export function appendParsedEvents(events, accumulated, reasonAccumulated = "") {
  let nextAccumulated = accumulated;
  let nextReasonAccumulated = reasonAccumulated;
  let changed = false;
  let reasonChanged = false;
  let streamDone = false;

  for (const event of events) {
    const data = readSseData(event);

    if (data.done) {
      streamDone = true;
      break;
    }

    if (data.type === "reason") {
      const reasonContent = data.reason || data.content;
      if (!reasonContent) continue;
      nextReasonAccumulated += reasonContent;
      reasonChanged = true;
      continue;
    }

    if (!data.content) continue;

    nextAccumulated += data.content;
    changed = true;
  }

  return {
    accumulated: nextAccumulated,
    reasonAccumulated: nextReasonAccumulated,
    changed,
    reasonChanged,
    done: streamDone,
  };
}
