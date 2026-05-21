const isProduction = process.env.NODE_ENV === "production";
const isDebugEnabled =
  typeof window !== "undefined" &&
  (window.localStorage?.getItem("DS_DEBUG") === "true" ||
    window.__DS_DEBUG__ === true);
function shouldLog(level) {
  if (!isProduction) return true;

  return isDebugEnabled && level !== "debug";
}
export function logInfo(...args) {
  if (shouldLog("info")) console.info(...args);
}
export function logWarn(...args) {
  if (shouldLog("warn")) console.warn(...args);
}
export function logError(...args) {
  if (shouldLog("error")) console.error(...args);
}
