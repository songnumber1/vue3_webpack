export function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "y", "yes", "1"].includes(normalized)) return true;
    if (["false", "n", "no", "0", ""].includes(normalized)) return false;
  }

  return Boolean(value);
}
