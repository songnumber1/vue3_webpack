const PLATFORM_DEBUG_PREFIX = "[platform-override-debug]";

function canUseConsole() {
  return typeof console !== "undefined" && typeof console.log === "function";
}

export function logPlatformDebug(scope, payload = {}) {
  if (!canUseConsole()) return;
  console.log(`${PLATFORM_DEBUG_PREFIX} ${scope}`, payload);
}
