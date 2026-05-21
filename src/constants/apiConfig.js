export const API_KEYS = Object.freeze({
  DEFAULT: "DEFAULT",
  GENERATION: "GENERATION",
  LOGIN: "LOGIN",
});

export const DEFAULT_API_POLICY = Object.freeze({
  overlay: true,
  abort: true,
});

export const API_CONFIG = Object.freeze({
  [API_KEYS.GENERATION]: Object.freeze({
    overlay: false,
    abort: true,
  }),
  [API_KEYS.LOGIN]: Object.freeze({
    overlay: true,
    abort: false,
  }),
});

export function resolveApiPolicy(apiKey) {
  const policy = API_CONFIG[apiKey] || {};
  return {
    overlay:
      typeof policy.overlay === "boolean"
        ? policy.overlay
        : DEFAULT_API_POLICY.overlay,
    abort:
      typeof policy.abort === "boolean"
        ? policy.abort
        : DEFAULT_API_POLICY.abort,
  };
}
