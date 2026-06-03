/**
 * @file adapters/adapterPrimitives.js
 * @description Adapter 공통 primitive reader 모음입니다. 각 adapter에 흩어진 동일 helper를
 * 기능 변경 없이 모아 API 원본 key fallback 처리를 일관되게 유지합니다.
 */

import {readFirstDefined} from "@/utils/apiResponseReader";

export function readFirstString(...values) {
  const found = values.find(
    (value) => typeof value === "string" && value !== ""
  );
  return found || "";
}

export function readRaw(source, keys = [], fallback = undefined) {
  return readFirstDefined(source, keys, fallback);
}

export function readString(source, keys = [], fallback = "") {
  const value = readRaw(source, keys, fallback);
  if (value === undefined || value === null) return fallback;
  return String(value);
}

export function readNumber(source, keys = [], fallback = 0) {
  const value = readRaw(source, keys, fallback);
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function readBoolean(source, keys = []) {
  const value = readRaw(source, keys, false);
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "y", "yes", "1"].includes(normalized);
  }
  return Boolean(value);
}
