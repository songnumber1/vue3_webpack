export function canWrite(options) {
  if (typeof options.canWrite === "function") return options.canWrite();
  if (options.isReadOnly?.value) return false;
  if (options.isActiveModelUnavailable?.value) return false;
  return true;
}

export function isSelectedModelReasoning(options) {
  const modelId = options.selectedModel?.value || "";
  const models = Array.isArray(options.models?.value)
    ? options.models.value
    : [];
  const selected = models.find((model) => model.id === modelId);

  return Boolean(selected?.isReasoning);
}
