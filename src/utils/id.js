let fallbackCounter = 0;

/**
 * @description getRandomValuesSafe 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} bytes - bytes 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getRandomValuesSafe(bytes) {
  const cryptoObj = globalThis.crypto || globalThis.msCrypto;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
    // 계산된 결과를 호출부로 반환합니다.
    return bytes;
  }

  // 목록 또는 결과 집합을 순회하면서 필요한 값만 선별합니다.
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  // 계산된 결과를 호출부로 반환합니다.
  return bytes;
}

/**
 * @description createUuidV4Fallback 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createUuidV4Fallback() {
  const bytes = getRandomValuesSafe(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  // 계산된 결과를 호출부로 반환합니다.
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

/**
 * @description createId 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} prefix - prefix 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function createId(prefix = "id") {
  const cryptoObj = globalThis.crypto || globalThis.msCrypto;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof cryptoObj?.randomUUID === "function") {
    // 계산된 결과를 호출부로 반환합니다.
    return cryptoObj.randomUUID();
  }

  fallbackCounter += 1;
  // 계산된 결과를 호출부로 반환합니다.
  return `${prefix}-${Date.now().toString(36)}-${fallbackCounter.toString(36)}-${createUuidV4Fallback()}`;
}
