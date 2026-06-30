/**
 * @file api/live/accessApi.live.js
 * @description 실제 백엔드 API 호출 모듈입니다. mock API와 동일한 인터페이스를 유지해야 합니다.
 */

import {httpClient} from "@/api/clients/httpClient";
import {adaptGenericApiBody} from "@/adapters/assistantResponseAdapter";
import {resolveSessionAuthConfig} from "@/auth/authPolicy";

export async function getAccessInfo(payload = {}) {
  const response = await httpClient.post(
    resolveSessionAuthConfig().accessInfoUrl,
    payload
  );

  return adaptGenericApiBody(response, {});
}

export const accessApiLive = {getAccessInfo};
