import * as local from "../storage/adapters/local";
import * as session from "../storage/adapters/session";
import * as cookie from "../storage/adapters/cookie";
import * as indexed from "../storage/adapters/indexed";

const adapters = {
  local,
  session,
  cookie,
  indexed,
};

export async function setStorage(type, key, value, options) {
  try {
    await adapters[type].set(key, value, options);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e?.message || "SET_STORAGE_FAILED",
    };
  }
}

export async function getStorage(type, key) {
  try {
    const value = await adapters[type].get(key);
    return { ok: true, value };
  } catch (e) {
    return {
      ok: false,
      error: e?.message || "GET_STORAGE_FAILED",
    };
  }
}

export async function removeStorage(type, key) {
  try {
    await adapters[type].remove(key);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e?.message || "REMOVE_STORAGE_FAILED",
    };
  }
}
