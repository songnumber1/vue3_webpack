import {isNativeApp} from "@/core/config";
import {logWarn} from "@/utils/logger";

export function resolveErrorUI(appInfo, bridge) {
  if (isNativeApp(appInfo)) {
    return {
      notify(message) {
        bridge?.toast?.(message);
      },
    };
  }

  return {
    notify(message) {
      logWarn(message);
    },
  };
}
