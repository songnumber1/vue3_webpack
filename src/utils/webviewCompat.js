let resizeObserverId = 0;
let viewportCssVarsInstalled = false;

/**
 * @description getCryptoObject 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getCryptoObject() {
  // 계산된 결과를 호출부로 반환합니다.
  return globalThis.crypto || globalThis.msCrypto || null;
}

/**
 * @description createUuidV4Fallback 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createUuidV4Fallback() {
  const cryptoObj = getCryptoObject();
  const bytes = new Uint8Array(16);

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
  } else {
    // 목록 또는 결과 집합을 순회하면서 필요한 값만 선별합니다.
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  // 계산된 결과를 호출부로 반환합니다.
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

/**
 * @description installGlobalThisFallback 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function installGlobalThisFallback() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof globalThis !== "undefined") return;

  Object.defineProperty(Object.prototype, "__magic_global_this__", {
    get() {
      // 계산된 결과를 호출부로 반환합니다.
      return this;
    },
    configurable: true,
  });

  const root = Object.prototype.__magic_global_this__;
  root.globalThis = root;
  delete Object.prototype.__magic_global_this__;
}

/**
 * @description installCryptoRandomUuidFallback 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function installCryptoRandomUuidFallback() {
  const cryptoObj = getCryptoObject();
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!cryptoObj || typeof cryptoObj.randomUUID === "function") return;

  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    Object.defineProperty(cryptoObj, "randomUUID", {
      value: createUuidV4Fallback,
      configurable: true,
    });
  } catch (error) {
    void error;
  }
}

/**
 * @description installIdleCallbackFallback 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function installIdleCallbackFallback() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof window.requestIdleCallback !== "function") {
    window.requestIdleCallback = (callback) =>
      window.setTimeout(() => {
        callback({didTimeout: false, timeRemaining: () => 0});
      }, 1);
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof window.cancelIdleCallback !== "function") {
    window.cancelIdleCallback = (id) => window.clearTimeout(id);
  }
}

/**
 * @description installResizeObserverFallback 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function installResizeObserverFallback() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof window.ResizeObserver === "function") return;

  window.ResizeObserver = class ResizeObserverFallback {
    constructor(callback) {
      this.callback = callback;
      this.targets = new Set();
      this.id = `resize-observer-${(resizeObserverId += 1)}`;
      this.handleResize = () => this.flush();
      window.addEventListener("resize", this.handleResize, {passive: true});
    }

    observe(target) {
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (!target) return;
      this.targets.add(target);
      this.flush();
    }

    unobserve(target) {
      this.targets.delete(target);
    }

    disconnect() {
      this.targets.clear();
      window.removeEventListener("resize", this.handleResize);
    }

    flush() {
      const entries = Array.from(this.targets).map((target) => ({
        target,
        contentRect: target.getBoundingClientRect(),
      }));
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (entries.length) this.callback(entries, this);
    }
  };
}

/**
 * @description updateViewportCssVars 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function updateViewportCssVars() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const viewport = window.visualViewport;
  const height = Math.max(
    Math.round(viewport?.height || window.innerHeight || 0),
    320
  );
  const width = Math.max(
    Math.round(viewport?.width || window.innerWidth || 0),
    320
  );
  document.documentElement.style.setProperty("--app-height", `${height}px`);
  document.documentElement.style.setProperty("--app-width", `${width}px`);
  document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
}

/**
 * @description installViewportCssVars 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function installViewportCssVars() {
  updateViewportCssVars();

  // useViewportGuard가 화면별 동적 viewport 보정을 담당하므로 중복 리스너 등록은 1회로 제한합니다.
  if (viewportCssVarsInstalled) return;
  viewportCssVarsInstalled = true;

  // 초기 진입/비채팅 화면을 위한 최소 fallback만 유지하고 visualViewport 동적 갱신은 useViewportGuard에 위임합니다.
  window.addEventListener("resize", updateViewportCssVars, {passive: true});
  window.addEventListener("orientationchange", updateViewportCssVars, {
    passive: true,
  });
}

/**
 * @description installWebViewCompat 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function installWebViewCompat() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof window === "undefined") return;

  installGlobalThisFallback();
  installCryptoRandomUuidFallback();
  installIdleCallbackFallback();
  installResizeObserverFallback();
  installViewportCssVars();
}
