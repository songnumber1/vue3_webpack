/**
 * @file upload.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import { isNativeApp } from "@/core/config";

/**
 * resolveUploadStrategy 함수입니다.
 * @param {*} appInfo 함수 실행에 필요한 값입니다.
 * @param {*} http 함수 실행에 필요한 값입니다.
 * @param {*} bridge 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function resolveUploadStrategy(appInfo, http, bridge) {
  if (isNativeApp(appInfo)) {
    return {
      upload: (fileMeta) => bridge?.uploadFile?.(JSON.stringify(fileMeta)),
    };
  }

  return {
    upload: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return http.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
  };
}
