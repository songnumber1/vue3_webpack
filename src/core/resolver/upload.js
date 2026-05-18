import {isNativeApp} from "@/core/config";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description resolveUploadStrategy 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @param {*} http - http 입력값입니다.
 * @param {*} bridge - bridge 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function resolveUploadStrategy(appInfo, http, bridge) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isNativeApp(appInfo)) {
    // 계산된 결과를 호출부로 반환합니다.
    return {
      upload: (fileMeta) => bridge?.uploadFile?.(JSON.stringify(fileMeta)),
    };
  }

  // 계산된 결과를 호출부로 반환합니다.
  return {
    upload: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      // 계산된 결과를 호출부로 반환합니다.
      return http.post("/upload", formData, {
        headers: {"Content-Type": "multipart/form-data"},
      });
    },
  };
}
