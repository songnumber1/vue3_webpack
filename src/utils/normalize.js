export function normalizeText(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

export function normalizeId(value) {
  return normalizeText(value);
}

export function normalizeNullableId(value) {
  const id = normalizeId(value);
  return id || null;
}

export function normalizeMessageId(value) {
  return normalizeId(value);
}

export function normalizeNullableMessageId(value) {
  return normalizeNullableId(value);
}

export function normalizeChatId(value) {
  return normalizeId(value);
}

export function normalizeHistoryId(value) {
  return normalizeId(value);
}
