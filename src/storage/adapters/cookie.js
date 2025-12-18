const MAX_COOKIE_SIZE = 3800; // 안전 마진

export async function set(key, value, { days = 7 } = {}) {
  try {
    if (value === null || value === undefined) return false;

    const raw = typeof value === "string" ? value : JSON.stringify(value);

    // 🔴 크기 초과 방어
    if (raw.length > MAX_COOKIE_SIZE) {
      console.warn(
        `[cookie] value too large, skip storing key=${key}`,
        raw.length
      );
      return false;
    }

    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${key}=${encodeURIComponent(
      raw
    )}; expires=${expires}; path=/`;

    return true;
  } catch {
    return false;
  }
}

export async function get(key) {
  try {
    const m = document.cookie.match(new RegExp("(^| )" + key + "=([^;]+)"));

    if (!m) return null;

    const decoded = decodeURIComponent(m[2]);

    // JSON 파싱 시도
    try {
      return JSON.parse(decoded);
    } catch {
      // JSON 아니면 문자열 반환
      return decoded;
    }
  } catch {
    return null;
  }
}

export async function remove(key) {
  try {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    return true;
  } catch {
    return false;
  }
}
