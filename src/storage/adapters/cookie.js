export function set(key, value, { days = 7 } = {}) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${key}=${encodeURIComponent(
    JSON.stringify(value)
  )}; expires=${expires}; path=/`;
}

export function get(key) {
  const m = document.cookie.match(new RegExp("(^| )" + key + "=([^;]+)"));
  return m ? JSON.parse(decodeURIComponent(m[2])) : null;
}

export function remove(key) {
  document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
}
