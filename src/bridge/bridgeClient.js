import {AndroidToJsContract, JsToAndroidContract, WebApiContract} from './contract';
import {BRIDGE_CATEGORY, BRIDGE_TIMEOUT} from './bridgeConstants';
import {getActivePinia} from 'pinia';
import {usePlatformStore} from '@/stores/platformStore';
import {logWarn} from '@/utils/logger';
import {
  callDirectAndroidBridge,
  hasDirectAndroidBridge,
  hasPostMessageBridge,
  postAndroidBridgeMessage,
} from './adapters/androidBridgeAdapter';
import {
  completeBridgeCallback,
  registerBridgeCallback,
  unregisterBridgeCallback,
} from './registry/bridgeCallbackRegistry';
import {parseNativePayload} from './utils/bridgeRequestUtils';
import {
  createErrorResponse,
  createNativeHandlerErrorResponse,
  createSuccessResponse,
  normalizeBridgeResponse,
} from './utils/bridgeResponseUtils';
import {
  getContract,
  throwIfErrorResponse,
  validateBridgeErrorResponse,
  validateBridgeRequest,
  validateBridgeResponse,
} from './validation';

function createBridgeUnavailableResponse(request, type) {
  const response = createErrorResponse(
    request,
    `AndroidBridge가 없어 ${type} 요청을 실제 Native로 전달할 수 없습니다. Windows/Web 브라우저에서는 성공 mock을 반환하지 않습니다.`,
    'ANDROID_BRIDGE_UNAVAILABLE'
  );
  response.meta = {...response.meta, type, phase: 'native-bridge', status: 503};
  return response;
}

function completeBridgeResponse(rawResponse) {
  completeBridgeCallback(rawResponse);
}

function getApiBaseUrl() {
  const configured = process.env.VUE_APP_API_BASE_URL || '/api';
  return configured.replace(/\/$/, '');
}

function interpolatePath(path, payload) {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_, key) =>
    encodeURIComponent(payload?.[key] ?? '')
  );
}

function buildBackendUrl(contract, payload) {
  const rawPath = contract.httpPath || `/${contract.type?.toLowerCase?.() || ''}`;
  const path = interpolatePath(rawPath, payload);
  return `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

function pickRequestBody(method, request) {
  const normalizedMethod = method.toUpperCase();
  if (normalizedMethod === 'GET' || normalizedMethod === 'HEAD') return undefined;
  return JSON.stringify(request);
}

async function parseBackendBody(response) {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (!text) return null;
  if (contentType.includes('application/json')) return JSON.parse(text);
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

function normalizeBackendSuccess(request, backendBody, contract) {
  if (
    backendBody &&
    typeof backendBody === 'object' &&
    typeof backendBody.isSuccess === 'boolean'
  ) {
    return backendBody;
  }

  return createSuccessResponse(request, backendBody, 'Backend API를 실제 호출한 결과입니다.', {
    category: BRIDGE_CATEGORY.WEB_API,
    runtime: 'backend',
    endpoint: contract.httpPath,
    method: contract.httpMethod,
  });
}

function normalizeBackendError(request, response, backendBody, contract) {
  const status = response?.status || 500;
  const statusText = response?.statusText || 'Backend Error';
  const backendMessage = backendBody?.message || backendBody?.error || backendBody?.detail;
  const error = createErrorResponse(
    request,
    backendMessage || `${status} ${statusText}`,
    backendBody?.code || 'BACKEND_ERROR'
  );
  error.meta = {
    ...error.meta,
    category: BRIDGE_CATEGORY.WEB_API,
    runtime: 'backend',
    endpoint: contract.httpPath,
    method: contract.httpMethod,
    status,
  };
  return error;
}

export async function executeWebApi(type, payload = {}) {
  const request = validateBridgeRequest(type, payload, WebApiContract);
  const contract = getContract(type, WebApiContract);
  const method = contract.httpMethod || 'POST';
  const url = buildBackendUrl(contract, request);

  try {
    const response = await fetch(url, {
      method,
      headers: {'Content-Type': 'application/json'},
      credentials: 'include',
      body: pickRequestBody(method, request),
    });
    const backendBody = await parseBackendBody(response);
    const normalized = response.ok
      ? normalizeBackendSuccess(request, backendBody, contract)
      : normalizeBackendError(request, response, backendBody, contract);
    const bridgeResponse = normalized.isSuccess
      ? validateBridgeResponse(type, normalized, WebApiContract, request)
      : validateBridgeErrorResponse(type, normalized, WebApiContract, request);

    if (!bridgeResponse.isSuccess) throwIfErrorResponse(type, bridgeResponse, WebApiContract);
    return bridgeResponse;
  } catch (error) {
    if (error?.response) throw error;

    const errorResponse = createErrorResponse(request, error, 'BACKEND_CALL_ERROR');
    errorResponse.meta = {
      category: BRIDGE_CATEGORY.WEB_API,
      runtime: 'backend',
      endpoint: contract.httpPath,
      method,
      status: 500,
    };
    throwIfErrorResponse(type, errorResponse, WebApiContract);
    return errorResponse;
  }
}

export function callNative(type, payload, timeout = BRIDGE_TIMEOUT) {
  return new Promise((resolve, reject) => {
    let validPayload;
    try {
      validPayload = validateBridgeRequest(type, payload, JsToAndroidContract);
    } catch (error) {
      reject(error);
      return;
    }

    const {requestId} = validPayload;
    const canUsePostMessage = hasPostMessageBridge();
    const canUseDirectMethod = hasDirectAndroidBridge(type);

    if (!canUsePostMessage && !canUseDirectMethod) {
      const errorResponse = createBridgeUnavailableResponse(validPayload, type);
      const error = new Error(errorResponse.message);
      error.response = errorResponse;
      error.status = errorResponse.meta?.status || 503;
      reject(error);
      return;
    }

    let settled = false;
    let unregister = () => {};
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      unregisterBridgeCallback(requestId);
      const errorResponse = createErrorResponse(
        validPayload,
        'AndroidBridge 응답 대기 시간이 초과되었습니다.',
        'ANDROID_BRIDGE_TIMEOUT'
      );
      errorResponse.meta = {...errorResponse.meta, type, phase: 'response', status: 504};
      const error = new Error(errorResponse.message);
      error.response = errorResponse;
      error.status = 504;
      reject(error);
    }, timeout);

    unregister = registerBridgeCallback(requestId, (rawResponse) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      unregister();
      try {
        const response = normalizeBridgeResponse(rawResponse, validPayload);
        throwIfErrorResponse(type, response, JsToAndroidContract);
        resolve(validateBridgeResponse(type, response, JsToAndroidContract, validPayload));
      } catch (error) {
        reject(error);
      }
    });

    if (canUsePostMessage) {
      try {
        const rawResponse = postAndroidBridgeMessage(type, validPayload);
        if (rawResponse) completeBridgeResponse(normalizeBridgeResponse(rawResponse, validPayload));
      } catch (error) {
        const errorResponse = createErrorResponse(validPayload, error, 'ANDROID_BRIDGE_ERROR');
        errorResponse.meta = {...errorResponse.meta, type, phase: 'request', status: 500};
        completeBridgeResponse(errorResponse);
      }
      return;
    }

    callDirectAndroidBridge(type, validPayload)
      .then((rawResponse) => completeBridgeResponse(normalizeBridgeResponse(rawResponse, validPayload)))
      .catch((error) => {
        const errorResponse = createErrorResponse(validPayload, error, 'ANDROID_BRIDGE_ERROR');
        errorResponse.meta = {...errorResponse.meta, type, phase: 'request', status: 500};
        completeBridgeResponse(errorResponse);
      });
  });
}

export function rejectAndroidToJsSwaggerExecution(type, payload = {}) {
  let request;
  try {
    request = validateBridgeRequest(type, payload, AndroidToJsContract);
  } catch (error) {
    return Promise.reject(error);
  }

  const errorResponse = createErrorResponse(
    request,
    `${type}는 Android Native가 WebView의 JS 함수를 호출해야 하는 이벤트입니다. Swagger/Web 화면에서 성공 mock으로 실행하지 않습니다. Android에서 window.onAppResume/onBackPressed/onPushClick 또는 window.__receiveNativeEvent를 호출해 테스트해야 합니다.`,
    'ANDROID_TO_JS_REQUIRES_NATIVE_DISPATCH'
  );
  errorResponse.meta = {...errorResponse.meta, type, phase: 'native-dispatch', status: 501};

  const error = new Error(errorResponse.message);
  error.response = errorResponse;
  error.status = 501;
  return Promise.reject(error);
}

export function receiveNativeEvent(type, payload = {}) {
  const request = validateBridgeRequest(type, parseNativePayload(payload), AndroidToJsContract);

  try {
    const activePinia = getActivePinia();
    if (activePinia) {
      usePlatformStore(activePinia).recordNativeEvent(type, request);
    } else {
      window.__pendingNativeEvents = window.__pendingNativeEvents || [];
      window.__pendingNativeEvents.push({type, payload: request});
    }
  } catch (error) {
    window.__pendingNativeEvents = window.__pendingNativeEvents || [];
    window.__pendingNativeEvents.push({type, payload: request});
    logWarn('Failed to record native event.', error);
  }

  window.dispatchEvent(new CustomEvent('android-to-js', {detail: {type, payload: request}}));

  const globalHandler = window[`__${type}`];
  if (typeof globalHandler === 'function') globalHandler(request);

  const response = createSuccessResponse(
    request,
    {handled: true, eventName: type},
    'Android Native가 호출한 JS 이벤트를 수신했습니다.',
    {category: 'android-to-js', runtime: 'native-dispatch'}
  );

  return validateBridgeResponse(type, response, AndroidToJsContract, request);
}

function createNativeEventHandler(type) {
  return (payload = {}) => {
    try {
      return JSON.stringify(receiveNativeEvent(type, payload));
    } catch (error) {
      return JSON.stringify(createNativeHandlerErrorResponse(parseNativePayload(payload), error));
    }
  };
}

export function executeContract(category, type, payload = {}) {
  if (category === 'web-api') return executeWebApi(type, payload);
  if (category === 'js-to-android') return callNative(type, payload);
  if (category === 'android-to-js') return rejectAndroidToJsSwaggerExecution(type, payload);
  return executeWebApi(type, payload);
}

if (typeof window !== 'undefined') {
  window.__bridgeResponse = completeBridgeResponse;
  window.__receiveNativeEvent = (type, payload = {}) => {
    try {
      return JSON.stringify(receiveNativeEvent(type, payload));
    } catch (error) {
      return JSON.stringify(createNativeHandlerErrorResponse(parseNativePayload(payload), error));
    }
  };
  window.onAppResume = createNativeEventHandler('ON_APP_RESUME');
  window.onBackPressed = createNativeEventHandler('ON_BACK_PRESSED');
  window.onFileSelected = createNativeEventHandler('ON_FILE_SELECTED');
  window.onNetworkChange = createNativeEventHandler('ON_NETWORK_CHANGE');
  window.onPushClick = createNativeEventHandler('ON_PUSH_CLICK');
  window.onSessionExpired = createNativeEventHandler('ON_SESSION_EXPIRED');
  window.onAppPause = createNativeEventHandler('ON_APP_PAUSE');
  window.onWebViewClose = createNativeEventHandler('ON_WEBVIEW_CLOSE');
  window.onRequestCancel = createNativeEventHandler('ON_REQUEST_CANCEL');
  window.onNativeError = createNativeEventHandler('ON_NATIVE_ERROR');
}
