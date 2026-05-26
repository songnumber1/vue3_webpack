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

function callBridgeSetter(name, value) {
  if (typeof window === "undefined") return;
  const bridge = window.AndroidBridge;
  const setter = bridge?.[name];
  try {
    if (typeof setter === "function") setter.call(bridge, value || "");
  } catch (_error) {
    // Native bridge 구현체가 setter를 제공하지 않는 경우 브라우저 저장소만 사용합니다.
  }
}

export function setTokens({accessToken, refreshToken} = {}) {
  const storage = getStorage();
  if (storage) {
    if (accessToken) storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  if (accessToken) {
    callBridgeSetter("setAccessToken", accessToken);
    callBridgeSetter("setToken", accessToken);
  }
  if (refreshToken) callBridgeSetter("setRefreshToken", refreshToken);
}

export function clearTokens() {
  const storage = getStorage();
  if (storage) {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
  }
  callBridgeSetter("setAccessToken", "");
  callBridgeSetter("setToken", "");
  callBridgeSetter("setRefreshToken", "");
}
