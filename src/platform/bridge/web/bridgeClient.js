/**
 * @file platform/bridge/web/bridgeClient.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
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
