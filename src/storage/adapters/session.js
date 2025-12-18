export function set(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function get(key) {
  const v = sessionStorage.getItem(key);
  return v ? JSON.parse(v) : null;
}

export function remove(key) {
  sessionStorage.removeItem(key);
}

export function clear() {
  sessionStorage.clear();
}
