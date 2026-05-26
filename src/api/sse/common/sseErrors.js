export function isGenerationAbortError(error) {
  const message = String(error?.message || error || "");
  return (
    error?.name === "AbortError" ||
    error?.code === 20 ||
    /aborted|abort|page lifecycle ended|page lifecycle frozen|mobile page hidden|mobile page frozen|mobile page unloading|android app pause|ERR_CONNECTION_ABORTED|network error|networkerror|failed to fetch|load failed/i.test(
      message
    )
  );
}

export function createAbortError(reason) {
  if (typeof DOMException !== "undefined") {
    return new DOMException(reason || "Aborted", "AbortError");
  }

  const error = new Error(reason || "Aborted");

  error.name = "AbortError";
  return error;
}


export function abortGenerationController(controller, reason) {
  if (!controller || controller.signal.aborted) return;

  const abortReason = createAbortError(reason);
  try {
    controller.abort(abortReason);
  } catch (_error) {
    controller.abort();
  }
}
