function readBooleanEnv(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;

  return ["true", "1", "yes", "y"].includes(String(value).toLowerCase());
}

export const ENABLE_AUTH_GUARD = readBooleanEnv(
  process.env.VUE_APP_ENABLE_AUTH_GUARD,
  true
);

export const USE_MOCK_AUTH = readBooleanEnv(
  process.env.VUE_APP_USE_MOCK_AUTH,
  false
);

export const ALLOW_LOCAL_STORAGE_MOCK_AUTH = readBooleanEnv(
  process.env.VUE_APP_ALLOW_LOCAL_STORAGE_MOCK_AUTH,
  false
);

export const AUTH_MOCK_SCENARIO_STORAGE_KEY = "DS_AUTH_MOCK_SCENARIO";

export const AUTH_MOCK_SCENARIOS = Object.freeze({
  AUTHENTICATED: "authenticated",
  LOGIN_REQUIRED: "login",
  ACCESS_DENIED: "access-denied",
  USER_AGREE_REQUIRED: "user-agree",
  ERROR: "error",
});

export const AUTH_FAILURE_REASONS = Object.freeze({
  AUTHENTICATED: "AUTHENTICATED",
  LOGIN_REQUIRED: "LOGIN_REQUIRED",
  ACCESS_DENIED: "ACCESS_DENIED",
  USER_AGREE_REQUIRED: "USER_AGREE_REQUIRED",
  AUTH_ERROR: "AUTH_ERROR",
});

export const ENABLE_AUTH_GUARD_CACHE = readBooleanEnv(
  process.env.VUE_APP_ENABLE_AUTH_GUARD_CACHE,
  false
);

export const ENABLE_AUTH_GUARD_DEBUG = readBooleanEnv(
  process.env.VUE_APP_ENABLE_AUTH_GUARD_DEBUG,
  false
);
