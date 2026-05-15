/**
 * @file httpClient.js
 * @description Mock API와 Live API 전환 시 공통으로 사용하는 axios 기반 HTTP client factory입니다.
 */

import axios from "axios";

/**
 * 서비스 API 호출용 axios instance를 생성합니다.
 *
 * method: axios.create
 * payload: { baseURL, timeout, withCredentials }
 * response: AxiosInstance
 * 특징: 공통 화면 interceptor와 분리된 순수 API client이므로 mock/live 전환과 테스트가 쉽습니다.
 *
 * @returns {import('axios').AxiosInstance} API 호출 전용 axios 인스턴스입니다.
 */
export function createHttpClient() {
  return axios.create({
    baseURL: process.env.VUE_APP_API_BASE_URL || "/api",
    timeout: Number(process.env.VUE_APP_API_TIMEOUT || 15000),
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export const httpClient = createHttpClient();
