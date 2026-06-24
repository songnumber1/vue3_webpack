/**
 * @file platform/bridge/runtime/bridgeRuntime.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 */

import {completeBridgeResponse} from "./bridgeCallbackRegistry";
import {registerAndroidToJsGlobalHandlers} from "../native/bridgeAndroidToJsRuntime";

export function registerBridgeRuntimeGlobals() {
  window.__bridgeResponse = completeBridgeResponse;
  registerAndroidToJsGlobalHandlers();
}
