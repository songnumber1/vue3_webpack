export async function get(key) {
  try {
    const v = localStorage.getItem(key);

    if (v === null || v === undefined || v === "") {
      return null;
    }

    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  } catch {
    return null;
  }
}

export async function set(key, value) {
  try {
    if (value === null || value === undefined) return false;

    if (typeof value === "string") {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
    return true;
  } catch {
    return false;
  }
}

export async function remove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
