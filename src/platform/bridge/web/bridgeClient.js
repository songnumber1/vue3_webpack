import {callNative} from "../native/bridgeNativeRuntime";
import {executeWebApi} from "./bridgeWebApiRuntime";
import {rejectAndroidToJsSwaggerExecution} from "../native/bridgeAndroidToJsRuntime";
import {registerBridgeRuntimeGlobals} from "../runtime/bridgeRuntime";

export {callNative} from "../native/bridgeNativeRuntime";
export {executeWebApi} from "./bridgeWebApiRuntime";
export {
  receiveNativeEvent,
  rejectAndroidToJsSwaggerExecution,
} from "../native/bridgeAndroidToJsRuntime";

export function executeContract(category, type, payload = {}) {
  if (category === "web-api") return executeWebApi(type, payload);
  if (category === "js-to-android") return callNative(type, payload);
  if (category === "android-to-js") {
    return rejectAndroidToJsSwaggerExecution(type, payload);
  }
  return executeWebApi(type, payload);
}

registerBridgeRuntimeGlobals();
