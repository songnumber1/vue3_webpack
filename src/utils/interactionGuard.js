import {unref} from "vue";

export function resolveBooleanSource(source) {
  return Boolean(unref(source));
}

export function resolveBlocked(source) {
  if (typeof source === "function") return Boolean(source());
  return resolveBooleanSource(source);
}
