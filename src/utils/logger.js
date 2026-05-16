const isProduction = process.env.NODE_ENV === 'production';
const isDebugEnabled =
  typeof window !== 'undefined' &&
  (window.localStorage?.getItem('DS_DEBUG') === 'true' ||
    window.__DS_DEBUG__ === true);

/**
 * @description shouldLog 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} level - level 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function shouldLog(level) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!isProduction) return true;
  // 계산된 결과를 호출부로 반환합니다.
  return isDebugEnabled && level !== 'debug';
}

/**
 * @description logInfo 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} args - args 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function logInfo(...args) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (shouldLog('info')) console.info(...args);
}

/**
 * @description logWarn 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} args - args 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function logWarn(...args) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (shouldLog('warn')) console.warn(...args);
}

/**
 * @description logError 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} args - args 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function logError(...args) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (shouldLog('error')) console.error(...args);
}

/**
 * @description logDebug 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} args - args 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function logDebug(...args) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (shouldLog('debug')) console.debug(...args);
}
