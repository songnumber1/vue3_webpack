export function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    throw e;
  }
}

export function get(key) {
  const v = localStorage.getItem(key);
  return v ? JSON.parse(v) : null;
}

export function remove(key) {
  localStorage.removeItem(key);
}

export function clear() {
  localStorage.clear();
}
