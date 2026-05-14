/**
 * @file id.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

let fallbackCounter = 0;

/**
 * WebView에서 crypto.randomUUID가 없을 때도 난수 바이트를 안전하게 생성합니다.
 * @param {Uint8Array} bytes 난수를 채울 바이트 배열
 * @returns {Uint8Array} 난수가 채워진 배열
 */
/**
 * getRandomValuesSafe 처리 함수입니다.
 * @param {*} bytes 함수 실행에 필요한 입력값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getRandomValuesSafe(bytes) {
  const cryptoObj = globalThis.crypto || globalThis.msCrypto;
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
    return bytes;
  }

  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/**
 * crypto.randomUUID 미지원 환경을 위한 UUID v4 fallback 문자열을 생성합니다.
 * @returns {string} UUID v4 형식 문자열
 */
function createUuidV4Fallback() {
  const bytes = getRandomValuesSafe(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

/**
 * 메시지/임시 객체에서 사용하는 고유 id를 생성합니다.
 * @param {string} [prefix='id'] fallback id 접두사
 * @returns {string} crypto.randomUUID 또는 fallback id
 */
export function createId(prefix = "id") {
  const cryptoObj = globalThis.crypto || globalThis.msCrypto;
  if (typeof cryptoObj?.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }

  fallbackCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${fallbackCounter.toString(36)}-${createUuidV4Fallback()}`;
}
