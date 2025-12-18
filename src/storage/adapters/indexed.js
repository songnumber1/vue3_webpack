const DB = "ds-storage";
const STORE = "kv";

function open() {
  return new Promise((resolve) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
  });
}

export async function set(key, value) {
  const db = await open();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(value, key);
}

export async function get(key) {
  const db = await open();
  return new Promise((resolve) => {
    const req = db.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
  });
}

export async function remove(key) {
  const db = await open();
  db.transaction(STORE, "readwrite").objectStore(STORE).delete(key);
}
