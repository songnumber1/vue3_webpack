/**
 * @file utils/logger.js
 * @description 개발 중에는 호출 원본 stack을 함께 남기고, 운영에서는 디버그 모드에서만 로그를 출력합니다.
 */

const isProduction = process.env.NODE_ENV === "production";

const isDebugEnabled =
  typeof window !== "undefined" &&
  (window.localStorage?.getItem("DS_DEBUG") === "true" ||
    window.__DS_DEBUG__ === true);

function shouldLog(level) {
  if (!isProduction) return true;
  return isDebugEnabled && level !== "debug";
}

function getCallerStack() {
  if (isProduction || typeof Error !== "function") return "";
  const stack = new Error().stack || "";
  return stack.split("\n").slice(3).join("\n");
}

function withCallerStack(args) {
  const stack = getCallerStack();
  return stack ? [...args, `\n${stack}`] : args;
}

export function logInfo(...args) {
  if (shouldLog("info")) console.info(...withCallerStack(args));
}

export function logWarn(...args) {
  if (shouldLog("warn")) console.warn(...withCallerStack(args));
}

export function logError(...args) {
  if (shouldLog("error")) console.error(...withCallerStack(args));
}
