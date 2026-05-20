import {AUTH_FAILURE_REASONS} from "@/constants/auth";

const LOGIN_STATUSES = new Set(["login", "login_required", "login-required"]);
const ACCESS_DENIED_STATUSES = new Set([
  "accessdeny",
  "access_denied",
  "access-denied",
]);
const USER_AGREEMENT_STATUSES = new Set([
  "useragree",
  "user_agree",
  "user-agree",
]);

function pickFirst(source, keys) {
  if (!source || typeof source !== "object") return undefined;

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      return source[key];
    }
  }

  return undefined;
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeFlag(value) {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;

  if (typeof value === "string") {
    return ["true", "y", "yes", "1", "on"].includes(value.trim().toLowerCase());
  }

  return false;
}

export function normalizeAuthAccessInfo(accessInfo = {}) {
  const status = normalizeStatus(
    pickFirst(accessInfo, ["status", "Status", "result", "Result"])
  );
  const valid = pickFirst(accessInfo, ["valid", "Valid", "isValid", "IsValid"]);
  const user = pickFirst(accessInfo, ["user", "User", "userInfo", "UserInfo"]);

  const loginRequired =
    valid === false ||
    LOGIN_STATUSES.has(status) ||
    normalizeFlag(
      pickFirst(accessInfo, [
        "loginRequired",
        "LoginRequired",
        "login",
        "Login",
      ])
    ) ||
    !user;

  const accessDenied =
    ACCESS_DENIED_STATUSES.has(status) ||
    normalizeFlag(
      pickFirst(accessInfo, [
        "accessDeny",
        "AccessDeny",
        "accessDenied",
        "AccessDenied",
      ])
    );

  const userAgreementRequired =
    USER_AGREEMENT_STATUSES.has(status) ||
    normalizeFlag(
      pickFirst(accessInfo, [
        "userAgree",
        "UserAgree",
        "userAgreementRequired",
        "UserAgreementRequired",
      ])
    );

  return {
    raw: accessInfo,
    status,
    valid,
    user,
    loginRequired,
    accessDenied,
    userAgreementRequired,
  };
}

export function resolveAuthAccessResult(accessInfo = {}) {
  const normalized = normalizeAuthAccessInfo(accessInfo);

  if (normalized.accessDenied) {
    return {
      authenticated: false,
      reason: AUTH_FAILURE_REASONS.ACCESS_DENIED,
      accessInfo: normalized.raw,
      normalizedAccessInfo: normalized,
    };
  }

  if (normalized.userAgreementRequired) {
    return {
      authenticated: false,
      reason: AUTH_FAILURE_REASONS.USER_AGREE_REQUIRED,
      accessInfo: normalized.raw,
      normalizedAccessInfo: normalized,
    };
  }

  if (normalized.loginRequired) {
    return {
      authenticated: false,
      reason: AUTH_FAILURE_REASONS.LOGIN_REQUIRED,
      accessInfo: normalized.raw,
      normalizedAccessInfo: normalized,
    };
  }

  return {
    authenticated: true,
    reason: AUTH_FAILURE_REASONS.AUTHENTICATED,
    accessInfo: normalized.raw,
    normalizedAccessInfo: normalized,
  };
}
