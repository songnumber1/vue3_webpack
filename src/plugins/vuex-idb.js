import {get, set} from "idb-keyval";

export default function persistedPlugin(keys, storageKey = "vuex") {
  return async (store) => {
    const saved = await get(storageKey);
    if (saved) {
      for (const key of keys) {
        if (saved[key] !== undefined) {
          store.commit("set" + capitalize(key), saved[key]);
        }
      }
    }

    store.subscribe((mutation, state) => {
      const data = {};
      keys.forEach((key) => {
        try {
          data[key] = JSON.parse(JSON.stringify(state[key]));
        } catch (e) {
          console.warn("IndexedDB 저장 실패 (복제 불가 객체)", key);
        }
      });
      set(storageKey, data);
    });
  };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
