import {completeBridgeResponse} from "./bridgeCallbackRegistry";
import {registerAndroidToJsGlobalHandlers} from "./bridgeAndroidToJsRuntime";

export function registerBridgeRuntimeGlobals() {
  window.__bridgeResponse = completeBridgeResponse;
  registerAndroidToJsGlobalHandlers();
}
