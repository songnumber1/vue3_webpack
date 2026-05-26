const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage || null;
  } catch (_error) {
    return null;
  }
}

function readBridgeValue(name) {
  if (typeof window === "undefined") return "";
  const bridge = window.AndroidBridge;
  const member = bridge?.[name];
  try {
    if (typeof member === "function") return member.call(bridge) || "";
    return member || "";
  } catch (_error) {
    return "";
  }
}

export function getAccessToken() {
  return String(readBridgeValue("getAccessToken") || readBridgeValue("getToken") || getStorage()?.getItem(ACCESS_TOKEN_KEY) || "").trim();
}

export function getRefreshToken() {
  return String(readBridgeValue("getRefreshToken") || getStorage()?.getItem(REFRESH_TOKEN_KEY) || "").trim();
}

export function setTokens({accessToken, refreshToken} = {}) {
  const storage = getStorage();
  if (!storage) return;
  if (accessToken) storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
}
