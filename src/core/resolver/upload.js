/**
 * @file core/resolver/upload.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 */

import {isNativeApp} from "@/core/config/appConfig";

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
        headers: {"Content-Type": "multipart/form-data"},
      });
    },
  };
}
