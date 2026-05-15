/**
 * @file auth.js
 * @description Router authentication guard policy for access/info.do.
 */

/**
 * Converts a Vue CLI env value into a boolean while keeping an explicit default.
 *
 * @param {string|undefined} value - Environment value such as "true" or "false".
 * @param {boolean} fallback - Value used when the env variable is not defined.
 * @returns {boolean} Parsed boolean value.
 */
function readBooleanEnv(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["true", "1", "yes", "y"].includes(String(value).toLowerCase());
}

/**
 * Enables route-level authentication checks for routes with meta.requireAuth.
 *
 * method: vue-router beforeEach
 * payload: route.matched meta.requireAuth
 * response: true calls access/info.do before entering protected pages.
 *
 * Environment override:
 * - VUE_APP_ENABLE_AUTH_GUARD=true
 * - VUE_APP_ENABLE_AUTH_GUARD=false
 *
 * @type {boolean}
 */
export const ENABLE_AUTH_GUARD = readBooleanEnv(
  process.env.VUE_APP_ENABLE_AUTH_GUARD,
  false
);

/**
 * Enables mock authentication responses instead of a real network call.
 *
 * method: auth guard access/info.do resolver
 * payload: access/info.do request payload
 * response: true uses mock data and no browser network request is expected.
 *
 * @type {boolean}
 */
export const USE_MOCK_AUTH = readBooleanEnv(
  process.env.VUE_APP_USE_MOCK_AUTH,
  false
);

/**
 * Allows localStorage to override mock auth scenario while USE_MOCK_AUTH is enabled.
 *
 * @type {boolean}
 */
export const ALLOW_LOCAL_STORAGE_MOCK_AUTH = readBooleanEnv(
  process.env.VUE_APP_ALLOW_LOCAL_STORAGE_MOCK_AUTH,
  false
);

/**
 * localStorage key used to force a mock authentication scenario.
 *
 * @type {string}
 */
export const AUTH_MOCK_SCENARIO_STORAGE_KEY = "DS_AUTH_MOCK_SCENARIO";

/**
 * access/info.do mock response scenarios.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const AUTH_MOCK_SCENARIOS = Object.freeze({
  AUTHENTICATED: "authenticated",
  LOGIN_REQUIRED: "login",
  ACCESS_DENIED: "access-denied",
  USER_AGREE_REQUIRED: "user-agree",
  ERROR: "error",
});

/**
 * Normalized route authentication failure reasons.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const AUTH_FAILURE_REASONS = Object.freeze({
  AUTHENTICATED: "AUTHENTICATED",
  LOGIN_REQUIRED: "LOGIN_REQUIRED",
  ACCESS_DENIED: "ACCESS_DENIED",
  USER_AGREE_REQUIRED: "USER_AGREE_REQUIRED",
  AUTH_ERROR: "AUTH_ERROR",
});

/**
 * Reuses successful auth store state when true. Keep false for session-sensitive services.
 *
 * @type {boolean}
 */
export const ENABLE_AUTH_GUARD_CACHE = readBooleanEnv(
  process.env.VUE_APP_ENABLE_AUTH_GUARD_CACHE,
  false
);

/**
 * Emits route/auth guard console logs when enabled.
 *
 * @type {boolean}
 */
export const ENABLE_AUTH_GUARD_DEBUG = readBooleanEnv(
  process.env.VUE_APP_ENABLE_AUTH_GUARD_DEBUG,
  false
);
