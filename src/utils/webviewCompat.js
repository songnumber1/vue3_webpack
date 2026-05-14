/**
 * Android 실제 단말 WebView는 시뮬레이터/PC Chrome보다 일부 Web API가 늦게 들어오는 경우가 있다.
 * Swagger UI는 내부적으로 crypto.randomUUID, ResizeObserver, requestIdleCallback 등에 의존할 수 있어
 * 해당 API가 없는 단말에서는 화면이 렌더링되기 전에 JS 오류로 중단될 수 있다.
 */
let resizeObserverId = 0;

/**
 * getCryptoObject 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getCryptoObject() {
  return globalThis.crypto || globalThis.msCrypto || null;
}

/**
 * createUuidV4Fallback 처리 함수입니다.
 * @returns {void}
 */
function createUuidV4Fallback() {
  const cryptoObj = getCryptoObject();
  const bytes = new Uint8Array(16);

  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

/**
 * installGlobalThisFallback 처리 함수입니다.
 * @returns {void}
 */
function installGlobalThisFallback() {
  if (typeof globalThis !== "undefined") return;

  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Object.prototype, "__magic_global_this__", {
    get() {
      return this;
    },
    configurable: true,
  });

  // eslint-disable-next-line no-undef
  __magic_global_this__.globalThis = __magic_global_this__;
  // eslint-disable-next-line no-undef
  delete Object.prototype.__magic_global_this__;
}

/**
 * installCryptoRandomUuidFallback 처리 함수입니다.
 * @returns {void}
 */
function installCryptoRandomUuidFallback() {
  const cryptoObj = getCryptoObject();
  if (!cryptoObj || typeof cryptoObj.randomUUID === "function") return;

  try {
    Object.defineProperty(cryptoObj, "randomUUID", {
      value: createUuidV4Fallback,
      configurable: true,
    });
  } catch {
    // 일부 WebView는 crypto 객체 확장이 막혀 있을 수 있다. 이 경우 createId fallback이 별도로 동작한다.
  }
}

/**
 * installIdleCallbackFallback 처리 함수입니다.
 * @returns {void}
 */
function installIdleCallbackFallback() {
  if (typeof window.requestIdleCallback !== "function") {
    window.requestIdleCallback = (callback) =>
      window.setTimeout(() => {
        callback({ didTimeout: false, timeRemaining: () => 0 });
      }, 1);
  }

  if (typeof window.cancelIdleCallback !== "function") {
    window.cancelIdleCallback = (id) => window.clearTimeout(id);
  }
}

/**
 * installResizeObserverFallback 처리 함수입니다.
 * @returns {void}
 */
function installResizeObserverFallback() {
  if (typeof window.ResizeObserver === "function") return;

  window.ResizeObserver = class ResizeObserverFallback {
    constructor(callback) {
      this.callback = callback;
      this.targets = new Set();
      this.id = `resize-observer-${(resizeObserverId += 1)}`;
      this.handleResize = () => this.flush();
      window.addEventListener("resize", this.handleResize, { passive: true });
    }

    observe(target) {
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
      if (entries.length) this.callback(entries, this);
    }
  };
}

/**
 * updateViewportCssVars 처리 함수입니다.
 * @returns {void}
 */
function updateViewportCssVars() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const viewport = window.visualViewport;
  const height = Math.max(
    Math.round(viewport?.height || window.innerHeight || 0),
    320,
  );
  const width = Math.max(
    Math.round(viewport?.width || window.innerWidth || 0),
    320,
  );
  document.documentElement.style.setProperty("--app-height", `${height}px`);
  document.documentElement.style.setProperty("--app-width", `${width}px`);
  document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
}

/**
 * installViewportCssVars 처리 함수입니다.
 * @returns {void}
 */
function installViewportCssVars() {
  updateViewportCssVars();
  window.addEventListener("resize", updateViewportCssVars, { passive: true });
  window.addEventListener("orientationchange", updateViewportCssVars, {
    passive: true,
  });
  window.visualViewport?.addEventListener("resize", updateViewportCssVars, {
    passive: true,
  });
  window.visualViewport?.addEventListener("scroll", updateViewportCssVars, {
    passive: true,
  });
}

/**
 * installWebViewCompat 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function installWebViewCompat() {
  if (typeof window === "undefined") return;

  installGlobalThisFallback();
  installCryptoRandomUuidFallback();
  installIdleCallbackFallback();
  installResizeObserverFallback();
  installViewportCssVars();
}
