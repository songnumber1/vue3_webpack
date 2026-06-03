/**
 * @file utils/apiResponseReader.js
 * @description Axios/백엔드/mock 응답 wrapper를 안전하게 읽기 위한 공통 reader입니다.
 * 1단계에서는 기반만 추가하고, 기존 컴포넌트/스토어의 접근 로직은 대량 치환하지 않습니다.
 */

import {API_RESPONSE_KEYS as R} from "@/constants/api/apiResponseKeys";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function unwrapAxiosData(response, fallback = null) {
  if (response === undefined || response === null) return fallback;
  if (
    isObject(response) &&
    Object.prototype.hasOwnProperty.call(response, R.DATA)
  ) {
    return response[R.DATA];
  }
  return response;
}

export function unwrapApiBody(response, fallback = null) {
  const data = unwrapAxiosData(response, fallback);
  if (data === undefined || data === null) return fallback;

  if (isObject(data) && Object.prototype.hasOwnProperty.call(data, R.RESULT)) {
    return data[R.RESULT];
  }
  if (isObject(data) && Object.prototype.hasOwnProperty.call(data, R.BODY)) {
    return data[R.BODY];
  }
  if (isObject(data) && Object.prototype.hasOwnProperty.call(data, R.DATA)) {
    return data[R.DATA];
  }

  return data;
}

export function readApiList(source, fallback = []) {
  const body = unwrapApiBody(source, source);

  if (Array.isArray(body)) return body;
  if (!isObject(body)) return fallback;

  if (Array.isArray(body[R.LIST])) return body[R.LIST];
  if (Array.isArray(body[R.RESULT_LIST])) return body[R.RESULT_LIST];
  if (Array.isArray(body[R.DATA])) return body[R.DATA];
  if (Array.isArray(body[R.ITEMS])) return body[R.ITEMS];
  if (Array.isArray(body[R.ROWS])) return body[R.ROWS];

  return fallback;
}

export function readApiValue(source, key, fallback = undefined) {
  const body = unwrapApiBody(source, source);
  if (!isObject(body) && !Array.isArray(body)) return fallback;

  return Object.prototype.hasOwnProperty.call(body, key) ? body[key] : fallback;
}

export function readFirstDefined(source, keys = [], fallback = undefined) {
  const body = unwrapApiBody(source, source);
  if (!isObject(body) && !Array.isArray(body)) return fallback;

  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(body, key) &&
      body[key] !== undefined
    ) {
      return body[key];
    }
  }

  return fallback;
}
