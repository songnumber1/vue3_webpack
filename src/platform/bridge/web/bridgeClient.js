/**
 * @file platform/bridge/web/bridgeClient.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 */

import {callNative} from "../native/bridgeNativeRuntime";
import {executeWebApi} from "./bridgeWebApiRuntime";
import {rejectAndroidToJsSwaggerExecution} from "../native/bridgeAndroidToJsRuntime";
import {registerBridgeRuntimeGlobals} from "../runtime/bridgeRuntime";

export function executeContract(category, type, payload = {}) {
  if (category === "web-api") return executeWebApi(type, payload);
  if (category === "js-to-android") return callNative(type, payload);
  if (category === "android-to-js") {
    return rejectAndroidToJsSwaggerExecution(type, payload);
  }
  return executeWebApi(type, payload);
}

registerBridgeRuntimeGlobals();
