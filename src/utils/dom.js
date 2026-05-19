
export function runAfterPaint(callback) {
  if (
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function"
  ) {
    window.requestAnimationFrame(callback);
    return;
  }

  setTimeout(callback, 0);
}
export function addMediaQueryListener(mediaQueryList, listener) {
  if (!mediaQueryList) return () => {};

  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", listener);

    return () => mediaQueryList.removeEventListener("change", listener);
  }

  if (typeof mediaQueryList.addListener === "function") {
    mediaQueryList.addListener(listener);

    return () => mediaQueryList.removeListener(listener);
  }

  return () => {};
}
