/**
 * 다양한 데이터 타입(불리언, 숫자, 문자열)의 값을 파싱하여 표준 참(true) 또는 거짓(false) 값으로 강제 정형화합니다.
 * 특히 문자열 "true", "y", "0" 등 실무 데이터에서 자주 쓰이는 대입 성격의 값들을 명확하게 판별합니다.
 * @param {*} value - 참/거짓으로 변환할 임의의 원본 데이터
 * @returns {boolean} 변환이 완료된 최종 불리언(Boolean) 값
 * @see {@link normalizeFlag} 인증 정보 모듈 내에서 이와 유사한 규칙으로 플래그를 정문화할 때 연동됩니다.
 */
export function toBoolean(value) {
  // 1. 이미 순수 불리언(boolean) 타입인 경우, 다른 검사 없이 원본 값을 그대로 반환합니다.
  if (typeof value === "boolean") return value;

  // 2. 숫자(number) 타입인 경우, 0은 거짓(false)으로 간주하고 0이 아닌 모든 숫자(예: 1, -1 등)는 참(true)으로 반환합니다.
  if (typeof value === "number") return value !== 0;

  // 3. 문자열(string) 타입인 경우, 구체적인 텍스트 내용 기반으로 판별을 진행합니다.
  if (typeof value === "string") {
    // 대소문자 혼재나 좌우 공백으로 인한 오작동을 방지하기 위해 공백을 깎고 소문자로 변환(Normalize)합니다.
    const normalized = value.trim().toLowerCase();

    // 긍정 표현식 배열(["true", "y", "yes", "1"])에 포함되어 있다면 true를 반환합니다.
    if (["true", "y", "yes", "1"].includes(normalized)) return true;

    // 부정 표현식 및 빈 값 배열(["false", "n", "no", "0", ""])에 포함되어 있다면 false를 반환합니다.
    if (["false", "n", "no", "0", ""].includes(normalized)) return false;
  }

  // 4. 상기 명시된 조건(배열 목록 등)에 걸리지 않은 기타 자료형(Object, Array, undefined 등)은 자바스크립트 본연의 기본 Boolean 가동 규칙(Truthy/Falsy)을 따르도록 처리합니다.
  return Boolean(value);
}
