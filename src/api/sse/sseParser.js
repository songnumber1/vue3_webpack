export const SSE_DONE_TOKEN = "[DONE]";

export function parseSseBuffer(buffer) {
  const events = [];
  const parts = String(buffer || "").split(/\r?\n\r?\n/);
  const rest = parts.pop() || "";

  parts.forEach((part) => {
    const dataLines = part
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.replace(/^data:\s?/, ""));
    if (!dataLines.length) return;
    events.push(dataLines.join("\n"));
  });

  return {events, rest};
}

export function readSseData(raw) {
  if (raw === SSE_DONE_TOKEN) return {done: true, content: ""};
  try {
    const parsed = JSON.parse(raw);
    return {
      done: false,
      content: String(parsed?.data ?? parsed?.content ?? ""),
    };
  } catch (_error) {
    return {done: false, content: String(raw || "")};
  }
}
