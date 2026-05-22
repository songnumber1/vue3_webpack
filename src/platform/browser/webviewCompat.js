let resizeObserverId = 0;
let viewportCssVarsInstalled = false;
function getCryptoObject() {
  return globalThis.crypto || globalThis.msCrypto || null;
}
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
function installGlobalThisFallback() {
  if (typeof globalThis !== "undefined") return;

  Object.defineProperty(Object.prototype, "__magic_global_this__", {
    get() {
      return this;
    },
    configurable: true,
  });

  const root = Object.prototype.__magic_global_this__;
  root.globalThis = root;
  delete Object.prototype.__magic_global_this__;
}
function installCryptoRandomUuidFallback() {
  const cryptoObj = getCryptoObject();
  if (!cryptoObj || typeof cryptoObj.randomUUID === "function") return;

  try {
    Object.defineProperty(cryptoObj, "randomUUID", {
      value: createUuidV4Fallback,
      configurable: true,
    });
  } catch (error) {
    void error;
  }
}
function installIdleCallbackFallback() {
  if (typeof window.requestIdleCallback !== "function") {
    window.requestIdleCallback = (callback) =>
      window.setTimeout(() => {
        callback({didTimeout: false, timeRemaining: () => 0});
      }, 1);
  }

  if (typeof window.cancelIdleCallback !== "function") {
    window.cancelIdleCallback = (id) => window.clearTimeout(id);
  }
}
function installResizeObserverFallback() {
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
function updateViewportCssVars() {
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
export function installWebViewCompat() {
  if (typeof window === "undefined") return;

  installGlobalThisFallback();
  installCryptoRandomUuidFallback();
  installIdleCallbackFallback();
  installResizeObserverFallback();
  installViewportCssVars();
}
