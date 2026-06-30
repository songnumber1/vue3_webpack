/**
 * @file core/resolver/axios.js
 * @description 세션 쿠키 기반 공통 Axios 인스턴스를 생성합니다.
 */

import axios from "axios";
import {SERVER_API_BASE_URL} from "@/constants/apiMode";

export function resolveAxios() {
  return axios.create({
    baseURL: SERVER_API_BASE_URL,
    timeout: Number(process.env.VUE_APP_API_TIMEOUT || 15000),
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
