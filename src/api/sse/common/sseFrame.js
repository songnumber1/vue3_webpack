import {readSseData} from "@/api/sse/sseParser";

export function appendParsedEvents(events, accumulated) {
  let nextAccumulated = accumulated;
  let changed = false;
  let streamDone = false;

  for (const event of events) {
    const data = readSseData(event);

    if (data.done) {
      streamDone = true;
      break;
    }

    if (!data.content) continue;

    nextAccumulated += data.content;
    changed = true;
  }

  return {
    accumulated: nextAccumulated,
    changed,
    done: streamDone,
  };
}
