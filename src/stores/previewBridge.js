
// Bridge between main Playground panels and the preview sub-app.
// Panels run in the main app instance.
// Preview runs in a separate Vue sub-app with its own Pinia.
// We communicate through window events (no DI).

const EVT = "ds-preview-store-patch";

export function patchPreviewStore(patch) {
  window.dispatchEvent(new CustomEvent(EVT, { detail: patch }));
}

export function onPreviewPatch(handler) {
  const fn = (e) => handler(e.detail || {});
  window.addEventListener(EVT, fn);
  return () => window.removeEventListener(EVT, fn);
}
