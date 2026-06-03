/**
 * @file adapters/assistantResponseAdapter.js
 * @description 일반 목록성 API가 배열 또는 wrapper 객체로 내려오는 경우를 공통 reader로 정리하기 위한 얇은 adapter입니다.
 */

import {readApiList, unwrapApiBody} from "@/utils/apiResponseReader";

export function adaptGenericApiList(response = [], fallback = []) {
  return readApiList(response, fallback);
}

export function adaptGenericApiBody(response = {}, fallback = {}) {
  return unwrapApiBody(response, fallback);
}
