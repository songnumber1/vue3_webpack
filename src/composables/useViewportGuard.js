import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useEventListener} from "@vueuse/core";
import {
  // 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
  KEYBOARD_THRESHOLD_PX,
  MIN_VIEWPORT_HEIGHT_PX,
  MOBILE_BREAKPOINT_PX,
  VIEWPORT_GUARD_DELAY_MS,
} from "@/constants/uiTokens";
import {
  MOBILE_BROWSER_CLASSES,
  MOBILE_BROWSER_CLASS_PREFIX,
  MOBILE_BROWSER_FAMILY,
  RUNTIME_CSS_VARS,
} from "@/constants/runtimeContracts";
import {getMobileBrowserFamily, getViewportSize} from "@/utils/viewport";

/**
 * @description applyBrowserViewportClass 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} browserFamily - browserFamily 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function applyBrowserViewportClass(browserFamily) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  root.classList.remove(...MOBILE_BROWSER_CLASSES);
  body?.classList.remove(...MOBILE_BROWSER_CLASSES);
  const className = `${MOBILE_BROWSER_CLASS_PREFIX}-${browserFamily || MOBILE_BROWSER_FAMILY.default}`;
  root.classList.add(className);
  body?.classList.add(className);
}

/**
 * @description isTextEditingElement 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} element - element 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function isTextEditingElement(element) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!element) return false;
  const tagName = element.tagName?.toLowerCase?.();
  // 계산된 결과를 호출부로 반환합니다.
  return (
    tagName === "textarea" ||
    tagName === "input" ||
    element.isContentEditable === true
  );
}

/**
 * @description getKeyboardMetrics 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} size - size 입력값입니다.
 * @param {*} baselineHeight - baselineHeight 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getKeyboardMetrics(size, baselineHeight = 0) {
  const visualHeight = Math.max(size.height || 0, MIN_VIEWPORT_HEIGHT_PX);
  const layoutHeight = Math.max(
    baselineHeight || 0,
    size.layoutHeight || 0,
    visualHeight,
    MIN_VIEWPORT_HEIGHT_PX
  );
  const offsetTop = Math.max(size.offsetTop || 0, 0);
  const visualBottom = offsetTop + visualHeight;
  const activeElement =
    typeof document !== "undefined" ? document.activeElement : null;
  const hasTextFocus = isTextEditingElement(activeElement);
  const candidateFromLayout = Math.max(
    (size.layoutHeight || 0) - visualBottom,
    0
  );
  const candidateFromBaseline = Math.max(layoutHeight - visualBottom, 0);
  const browserFamily = getMobileBrowserFamily();
  const keyboardHeight = hasTextFocus
    ? Math.max(candidateFromLayout, candidateFromBaseline)
    : 0;
  const composerInset = hasTextFocus
    ? browserFamily === MOBILE_BROWSER_FAMILY.samsung || browserFamily === MOBILE_BROWSER_FAMILY.firefox
      ? Math.max(candidateFromLayout, candidateFromBaseline)
      : candidateFromLayout
    : 0;

  // 계산된 결과를 호출부로 반환합니다.
  return {
    layoutHeight,
    keyboardHeight,
    composerInset,
    offsetTop,
  };
}

/**
 * @description setCssViewportVars 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} size - size 입력값입니다.
 * @param {*} baselineHeight - baselineHeight 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function setCssViewportVars(size, baselineHeight = 0) {
  const height = Math.max(size.height || 0, MIN_VIEWPORT_HEIGHT_PX);
  const width = Math.max(size.width || 0, MIN_VIEWPORT_HEIGHT_PX);
  const browserFamily = getMobileBrowserFamily();
  const {layoutHeight, keyboardHeight, composerInset, offsetTop} =
    getKeyboardMetrics(size, baselineHeight);
  const browserSafeBottom = browserFamily === MOBILE_BROWSER_FAMILY.firefox ? 0 : null;

  applyBrowserViewportClass(browserFamily);

  document.documentElement.style.setProperty(RUNTIME_CSS_VARS.appHeight, `${height}px`);
  document.documentElement.style.setProperty(RUNTIME_CSS_VARS.appWidth, `${width}px`);
  document.documentElement.style.setProperty(
    RUNTIME_CSS_VARS.layoutViewportHeight,
    `${layoutHeight}px`
  );
  document.documentElement.style.setProperty(
    RUNTIME_CSS_VARS.keyboardHeight,
    `${keyboardHeight}px`
  );
  document.documentElement.style.setProperty(
    RUNTIME_CSS_VARS.mobileKeyboardInset,
    `${keyboardHeight}px`
  );
  document.documentElement.style.setProperty(
    RUNTIME_CSS_VARS.composerKeyboardInset,
    `${composerInset}px`
  );
  if (browserFamily === MOBILE_BROWSER_FAMILY.firefox) {
    document.documentElement.style.setProperty(
      RUNTIME_CSS_VARS.firefoxMainComposerBottom,
      `${composerInset}px`
    );
  } else {
    document.documentElement.style.removeProperty(RUNTIME_CSS_VARS.firefoxMainComposerBottom);
  }
  document.documentElement.style.setProperty(
    RUNTIME_CSS_VARS.visualViewportOffsetTop,
    `${offsetTop}px`
  );
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (browserSafeBottom === null) {
    document.documentElement.style.removeProperty(
      RUNTIME_CSS_VARS.mobileBrowserSafeBottom
    );
  } else {
    document.documentElement.style.setProperty(
      RUNTIME_CSS_VARS.mobileBrowserSafeBottom,
      `${browserSafeBottom}px`
    );
  }
  document.documentElement.style.setProperty(RUNTIME_CSS_VARS.vh, `${height * 0.01}px`);

  // 계산된 결과를 호출부로 반환합니다.
  return {keyboardHeight, layoutHeight};
}

/**
 * @description useViewportGuard 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} options - options 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function useViewportGuard(options = {}) {
  const onChange = options.onChange || (() => {});
  const viewportHeight = ref(0);
  const viewportWidth = ref(0);
  const keyboardOpen = ref(false);
  const baselineHeight = ref(0);
  let resizeTimer = null;
  let resizeFrame = null;

  const isCompact = computed(
    () => viewportWidth.value > 0 && viewportWidth.value <= MOBILE_BREAKPOINT_PX
  );

  /**
   * @description apply 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function apply() {
    const size = getViewportSize();
    viewportHeight.value = size.height;
    viewportWidth.value = size.width;
    const activeElement =
      typeof document !== "undefined" ? document.activeElement : null;
    const hasTextFocus = isTextEditingElement(activeElement);
    const stableHeight = Math.max(size.height || 0, size.layoutHeight || 0);
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (
      !hasTextFocus &&
      (!baselineHeight.value || stableHeight > baselineHeight.value)
    ) {
      baselineHeight.value = stableHeight;
    }
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!baselineHeight.value)
      baselineHeight.value = stableHeight || size.height;

    const metrics = setCssViewportVars(size, baselineHeight.value);

    keyboardOpen.value =
      isCompact.value && metrics.keyboardHeight > KEYBOARD_THRESHOLD_PX;
    onChange({
      ...size,
      keyboardOpen: keyboardOpen.value,
      isCompact: isCompact.value,
    });
  }

  /**
   * @description scheduleApply 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function scheduleApply() {
    window.clearTimeout(resizeTimer);
    if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);

    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = null;
      apply();
    });

    const browserFamily = getMobileBrowserFamily();
    const delay =
      browserFamily === MOBILE_BROWSER_FAMILY.samsung
        ? VIEWPORT_GUARD_DELAY_MS.samsung
        : VIEWPORT_GUARD_DELAY_MS.default;
    resizeTimer = window.setTimeout(apply, delay);
  }

  useEventListener(window, "resize", scheduleApply, {passive: true});
  useEventListener(window, "orientationchange", scheduleApply, {passive: true});
  if (typeof window !== "undefined" && window.visualViewport) {
    useEventListener(window.visualViewport, "resize", scheduleApply, {
      passive: true,
    });
    useEventListener(window.visualViewport, "scroll", scheduleApply, {
      passive: true,
    });
  }
  useEventListener(document, "focusin", scheduleApply, {passive: true});
  useEventListener(document, "focusout", scheduleApply, {passive: true});

  // Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
  onMounted(() => {
    apply();
  });

  // Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
  onBeforeUnmount(() => {
    window.clearTimeout(resizeTimer);
    if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = null;
  });

  // 계산된 결과를 호출부로 반환합니다.
  return {
    viewportHeight,
    viewportWidth,
    keyboardOpen,
    isCompact,
    refreshViewport: scheduleApply,
  };
}
