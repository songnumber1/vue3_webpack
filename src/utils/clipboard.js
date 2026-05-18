/**
 * @description copyText 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} text - text 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function copyText(text) {
  const value = String(text ?? "");

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    // 계산된 결과를 호출부로 반환합니다.
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    // 계산된 결과를 호출부로 반환합니다.
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}
