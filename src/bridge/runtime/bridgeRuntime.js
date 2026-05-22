import {completeBridgeResponse} from "./bridgeCallbackRegistry";
import {registerAndroidToJsGlobalHandlers} from "../native/bridgeAndroidToJsRuntime";

export function registerBridgeRuntimeGlobals() {
  window.__bridgeResponse = completeBridgeResponse;
  registerAndroidToJsGlobalHandlers();
}
