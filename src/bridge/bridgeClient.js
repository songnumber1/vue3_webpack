import {callNative} from "./bridgeNativeRuntime";
import {executeWebApi} from "./bridgeWebApiRuntime";
import {rejectAndroidToJsSwaggerExecution} from "./bridgeAndroidToJsRuntime";
import {registerBridgeRuntimeGlobals} from "./bridgeRuntime";

export {callNative} from "./bridgeNativeRuntime";
export {executeWebApi} from "./bridgeWebApiRuntime";
export {
  receiveNativeEvent,
  rejectAndroidToJsSwaggerExecution,
} from "./bridgeAndroidToJsRuntime";

export function executeContract(category, type, payload = {}) {
  if (category === "web-api") return executeWebApi(type, payload);
  if (category === "js-to-android") return callNative(type, payload);
  if (category === "android-to-js") {
    return rejectAndroidToJsSwaggerExecution(type, payload);
  }
  return executeWebApi(type, payload);
}

registerBridgeRuntimeGlobals();
